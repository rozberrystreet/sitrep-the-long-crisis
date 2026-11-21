import { useId } from 'react'

// A deliberately schematic chart of an invented strait. Land stippling and
// the shipping lane share the same coordinate system at every screen width.
export function Chart({ pressure }: { pressure?: number }) {
  const dots = useId().replace(/:/g, '')
  const shore =
    'M-4 2H258L248 21 219 30 201 55 179 60 168 77 147 79 129 103 100 99 83 117 56 122 36 144 -4 151Z M610 43L581 54 565 73 544 77 537 101 501 114 493 139 468 146 453 171 427 176 399 198 377 202 357 224 329 236 315 259 287 270 277 292H610Z M-4 227L26 225 51 206 74 212 80 226 68 240 88 247 73 269 52 276 45 292H-4Z'
  return (
    <figure className="chart">
      <div className="chart-meta">
        <span>MARITIME DESK</span>
        <span>CHART OS–01</span>
      </div>
      <svg
        viewBox="0 0 600 290"
        role="img"
        aria-label="Fictional chart of the Orison Strait. The freight lane passes the inspection anchorage between Westhaven and the Eastern Reach."
      >
        <defs>
          <pattern id={dots} width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#a09e8e" />
          </pattern>
        </defs>
        <g stroke="#454742" strokeWidth=".65">
          {[40, 100, 160, 220, 280, 340, 400, 460, 520, 580].map((x) => (
            <path key={x} d={'M' + x + ' 0v290'} />
          ))}
          {[30, 90, 150, 210, 270].map((y) => (
            <path key={y} d={'M0 ' + y + 'h600'} />
          ))}
        </g>
        <path d={shore} fill={'url(#' + dots + ')'} stroke="#aaa998" strokeWidth="1.2" />
        <g fill="none" stroke="#898b7e" opacity=".28">
          {[8, 15, 24].map((n) => (
            <path key={n} d={shore} strokeWidth=".9" transform={'translate(0 ' + n + ')'} />
          ))}
        </g>
        <path
          d="M4 194L103 168 208 169 301 128 375 112 453 67 555 24 600 17"
          fill="none"
          stroke="#dedbca"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <circle cx="301" cy="128" r="23" fill="none" stroke="#ed6a54" />
        <circle cx="301" cy="128" r="5" fill="#ed6a54" />
        <path d="M316 146l20 23h43" fill="none" stroke="#ed6a54" />
        <g fontFamily="monospace" fontSize="11" letterSpacing="1" fill="#e4e1d6">
          <text x="28" y="42">
            WESTHAVEN
          </text>
          <text x="445" y="242">
            EASTERN REACH
          </text>
          <text x="169" y="219" fill="#b4b5a9" transform="rotate(-17 169 219)">
            ORISON STRAIT
          </text>
          <text x="338" y="185" fill="#ffa18b">
            ANCHORAGE
          </text>
        </g>
        <g stroke="#d5d5c8" fill="none">
          <path d="M567 21v22m-4-15 4-7 4 7" />
        </g>
      </svg>
      <figcaption>
        <span>
          <i /> Inspection anchorage
        </span>
        <span>
          {pressure === undefined ? 'Fictional waters' : 'Freight pressure ' + pressure + '/100'}
        </span>
      </figcaption>
    </figure>
  )
}
