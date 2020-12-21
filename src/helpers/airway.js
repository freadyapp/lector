// airway handles the start of the marker animation
// the target is to make it as smooooooooooooooooth
// as possible
//
//


const conf = {
  threshold: 8, // will run for the first 8 words
  divider: 8 // the lower the slower the acceleration
}

export function airway(time=0, session=0){
  if (session > conf.threshold) return time
  return (time*(conf.threshold - session))/conf.divider + time
}
