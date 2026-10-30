import body from './assets/body.svg'
import innerLeft from './assets/animated/arm-inner-left.svg'
import innerRight from './assets/animated/arm-inner-right.svg'
import middleLeft from './assets/animated/arm-middle-left.svg'
import middleRight from './assets/animated/arm-middle-right.svg'
import outerLeft from './assets/animated/arm-outer-left.svg'
import outerRight from './assets/animated/arm-outer-right.svg'
import innerLeftRest from './assets/arm-inner-left.svg'
import innerRightRest from './assets/arm-inner-right.svg'
import middleLeftRest from './assets/arm-middle-left.svg'
import middleRightRest from './assets/arm-middle-right.svg'
import outerLeftRest from './assets/arm-outer-left.svg'
import outerRightRest from './assets/arm-outer-right.svg'
import './auth-mascot.css'

const arms = [
  { moving: innerLeft, rest: innerLeftRest },
  { moving: innerRight, rest: innerRightRest },
  { moving: middleLeft, rest: middleLeftRest },
  { moving: middleRight, rest: middleRightRest },
  { moving: outerLeft, rest: outerLeftRest },
  { moving: outerRight, rest: outerRightRest },
]

export function AuthMascot() {
  return (
    <div className="auth-mascot" aria-hidden="true" data-testid="auth-mascot">
      {arms.map(({ moving, rest }) => (
        <picture key={moving}>
          <source media="(prefers-reduced-motion: reduce)" srcSet={rest} />
          <img
            className="auth-mascot-layer"
            src={moving}
            alt=""
            draggable={false}
          />
        </picture>
      ))}
      <img className="auth-mascot-layer" src={body} alt="" draggable={false} />
    </div>
  )
}
