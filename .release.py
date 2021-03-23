#!/usr/local/bin/python3
import requests
import subprocess as sp
import json
import os
import sys
from rich import print, inspect, console as _console

# code to automatically edit package.json to bumb version up
# code to automatically npm publish after running tests which pass

def release():
    sp.call("npm publish", shell=True)

console = _console.Console()
package_manager = os.environ.get('LECTORJSPKG') or "yarn"


if len(sys.argv) > 1:
    package_manager = sys.argv[1]


# subprocess.call(["export LECTOR_ENV='production'"], shell=True)
os.environ["LECTOR_ENV"] = 'production'
print(f"\n\n[bold cyan] Bundling with package manager: {package_manager} [/bold cyan] \n\n")
sp.call("python sass", shell=True)


# test

proc = sp.Popen("yarn test", stdout=sp.PIPE, shell=True)
streamdata = proc.communicate()[0]
if (proc.returncode == 0):
    print(f"\n\n[italic green] Tests passed!  [/italic green] \n\n")
else:
    print(f"\n\n[bold red] Tests failed. Aborting...!  [/bold red] \n\n")


# set version
v = requests.get(f"https://registry.npmjs.org/lectorjs").json()['dist-tags']['latest']
console.print(f": Latest version published on npm: {str(v)}", style="dim")

package = {}
with open('package.json', 'r') as f:
    package = json.load(f)


pv = package['version']

tag = "bold green" if str(v) == str(pv) else "bold yellow"
console.print(f": Current local version: {pv}", style=tag)

print(f"[bold]\n\n Input new version please: [/bold]")
new_version = input("⇝ ")

if len(new_version) ==  0:
    new_version = pv

print(f"[italic blink] Confirm publish this as version: {new_version} ?")
if input(f"[y/n] ⇝ ") == 'y':
    package['version'] = new_version
    with open('package.json', 'w') as outfile:
        json.dump(package, outfile, indent=4)

    release()
    print("\n [bold green] Package published succesfully to the NPM repository.")
else:
    print('\n[bold red] Aborted')


