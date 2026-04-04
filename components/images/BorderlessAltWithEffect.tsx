import { parseMana, getManaPipColor } from "@/lib/mana-utils";

const MANA_PIP_RIGHT_ANCHOR = 2650;
const MANA_PIP_SPACING = 210;
const MANA_PIP_Y = 475;
const MANA_PIP_RADIUS = 90;

type BorderlessAltWithEffectProps = {
  border?: boolean;
  opacity?: number;
  pinlineColor?: string;
  pinlineColorEnd?: string;
  imageUrl?: string;
  cardName?: string;
  typeLine?: string;
  oracleText?: string;
  manaCost?: string;
};

export const BorderlessAltWithEffect = ({
  border = true,
  opacity = 0.5,
  pinlineColor = "#f6d362",
  pinlineColorEnd = "#f6d362",
  imageUrl,
  cardName,
  typeLine,
  oracleText,
  manaCost,
}: BorderlessAltWithEffectProps) => {
  return (
    <svg
      id="Borderless_Alt"
      data-name="Borderless Alt"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 3264 4440.11"
      className="bg-cover aspect-136/185"
      style={{ backgroundImage: `url('${imageUrl}')` }}
    >
      <defs>
        <style>
          {`
          @font-face {                                                    
            font-family: 'Beleren';                                        
            src: url('/fonts/Beleren2016-Bold.ttf') format('truetype');    
            font-weight: bold;                                             
          }                                                                
                                                                          
          @font-face {                                                    
            font-family: 'Plantin';
            src: url('/fonts/PlantinMTProRg.TTF') format('truetype');      
          }
                                                                          
          @font-face {                                
            font-family: 'Plantin';                                       
            src: url('/fonts/PlantinMTProRgIt.TTF') format('truetype');    
            font-style: italic;
          }                                                                
                                                      
          @font-face {                                                    
            font-family: 'Mana';
            src: url('/fonts/mana.ttf') format('truetype');                
          }

        .cls-1 { fill: none;}

        .cls-2 {
          fill: url(#linear-gradient-4);
        }

        .cls-3 {
          fill: url(#linear-gradient-3);
        }

        .cls-4 {
          fill: url(#linear-gradient-2);
        }

        .cls-5 {
          fill: url(#pinlineGradient);
        }

        .cls-6, .cls-7, .cls-8, .cls-9 {
          fill: #231f20;
        }

        .cls-border {
          fill: ${border ? "#000" : "none"};
        }

        .cls-10 {
          fill: #8f8c88;
        }

        .cls-11 {
          fill: url(#linear-gradient);
        }

        .cls-12 {
          fill: #fff;
        }

        .cls-12, .cls-7 {
          opacity: ${opacity};
        }

        .cls-13 {
          opacity: .8;
        }

        .cls-14, .cls-8 {
          opacity: .6;
        }

        .cls-15 {
          clip-path: url(#clippath);
        }

        .cls-9 {
          opacity: .1;
        }
        `}
        </style>
        <linearGradient id="pinlineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={pinlineColor} />
          <stop offset="40%" stopColor={pinlineColor} />
          <stop offset="60%" stopColor={pinlineColorEnd ?? pinlineColor} />
          <stop offset="100%" stopColor={pinlineColorEnd ?? pinlineColor} />
        </linearGradient>
        <linearGradient
          id="linear-gradient"
          x1="1616.5"
          y1="2491.11"
          x2="1616.5"
          y2="2707.11"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset={0} stopColor="#231f20" stopOpacity=".25" />
          <stop offset={1} stopColor="#231f20" stopOpacity=".75" />
        </linearGradient>
        <linearGradient
          id="linear-gradient-2"
          x1="1649.5"
          y1="2491.11"
          x2="1649.5"
          y2="2707.11"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset={0} stopColor="#fff" stopOpacity=".75" />
          <stop offset={1} stopColor="#fff" stopOpacity=".25" />
        </linearGradient>
        <clipPath id="clippath">
          <path
            className="cls-1"
            d="M2972,2599.11c0-93-53-148-53-148H347s-53,55-53,148c0,68.65,28.88,116.59,44,136.99v1260.01h2590v-1260.01c15.12-20.4,44-68.34,44-136.99ZM367,2491.11h2532s33,45,33,108-33,108-33,108H367s-33-45-33-108,33-108,33-108ZM2894,3962.11H372v-1221h2522v1221Z"
          />
        </clipPath>
        <linearGradient
          id="linear-gradient-3"
          x1="1616.5"
          y1="355.11"
          x2="1616.5"
          y2="571.11"
          xlinkHref="#linear-gradient"
        />
        <linearGradient
          id="linear-gradient-4"
          y1="355.11"
          y2="571.11"
          xlinkHref="#linear-gradient-2"
        />
      </defs>
      {border && (
        <path
          id="Border"
          className="cls-border"
          d="M2922,3990.11c0-62.04-.02-118.72,0-181,14.73-15.02,27.42-35.08,39.07-52.86,70.74-108.02,117.38-218.97,138.44-347.37l164.48-780.2c-.03,603.16.03,1208.17,0,1811.33-21.47.24-3263.99,0-3263.99,0v-1821.89l4.69,12.57c54.11,254.52,104.98,509.98,160.48,764.21,9.92,45.44,19.29,93.06,32.36,137.58,29.15,99.31,85.18,194.29,146.46,276.65.68,74.03,0,181,0,181"
        />
      )}
      <g id="Rules">
        <rect
          id="Textbox"
          className="cls-8"
          x={372}
          y="2741.11"
          width={2522}
          height={1221}
        />
        <polygon
          id="Shadow_Top_Right"
          data-name="Shadow Top Right"
          className="cls-7"
          points="2864 2741.11 372 2741.11 389 2758.11 2877 2758.11 2877 3945.11 2894 3962.11 2894 2771.11 2894 2741.11 2864 2741.11"
        />
        <polygon
          id="Shadow_Left"
          data-name="Shadow Left"
          className="cls-9"
          points="389 3945.11 372 3962.11 372 2741.11 389 2758.11 389 3945.11"
        />
        <polygon
          id="Highlight"
          className="cls-12"
          points="2877 3945.11 389 3945.11 372 3962.11 2894 3962.11 2877 3945.11"
        />
      </g>
      <g id="Type">
        <g id="Textbox-2" data-name="Textbox" className="cls-14">
          <path
            className="cls-6"
            d="M2899,2707.11H367s-33-45-33-108,33-108,33-108h2532s33,45,33,108-33,108-33,108Z"
          />
        </g>
        <path
          id="Shadow"
          className="cls-11"
          d="M2885,2690.11H381s-25-28-25-91,25-91,25-91l-14-17s-33,45-33,108,33,108,33,108h2532l-14-17Z"
        />
        <path
          id="Highlight-2"
          data-name="Highlight"
          className="cls-4"
          d="M2899,2491.11H367l14,17h2504s25,28,25,91-25,91-25,91l14,17s33-45,33-108-33-108-33-108Z"
        />
      </g>
      <g id="Pinlines">
        <g id="Type_and_Rules" data-name="Type and Rules">
          <g className="cls-15">
            <g>
              <path
                className="cls-5"
                d="M341,3993.11v-1258l-.59-.8c-16.21-21.87-43.41-68.51-43.41-135.2,0-47.33,14.17-84.46,26.05-107.28,11.02-21.16,22.17-34.26,25.27-37.72h2569.36c3.1,3.46,14.25,16.57,25.27,37.72,11.88,22.82,26.05,59.95,26.05,107.28,0,66.69-27.2,113.33-43.41,135.2l-.59.8v1258H341ZM375,3959.11h2516v-1215H375v1215ZM364.58,2489.33c-1.37,1.87-33.58,46.52-33.58,109.77s32.21,107.9,33.58,109.77l.9,1.23h2535.04l.9-1.23c1.37-1.87,33.58-46.52,33.58-109.77s-32.21-107.9-33.58-109.77l-.9-1.23H365.48l-.9,1.23Z"
              />
              <path
                className="cls-6"
                d="M2916.33,2457.11c3.89,4.48,14.04,17,24.07,36.32,11.68,22.48,25.6,59.07,25.6,105.68,0,29.21-5.35,57.6-15.91,84.39-8.85,22.46-19.52,39.06-26.91,49.03l-1.18,1.59v1255.99H344v-1255.99l-1.18-1.59c-7.39-9.97-18.06-26.57-26.91-49.03-10.56-26.79-15.91-55.18-15.91-84.39,0-46.61,13.92-83.2,25.6-105.68,10.04-19.32,20.19-31.84,24.07-36.32h2566.65M363.96,2713.11h2538.08l1.8-2.45c.35-.48,8.75-12.02,17.17-31.55,14.04-32.55,16.99-61.47,16.99-80,0-33.57-9.24-62.03-16.99-80-8.42-19.52-16.82-31.06-17.17-31.55l-1.8-2.45H363.96l-1.8,2.45c-.35.48-8.75,12.02-17.17,31.55-14.04,32.55-16.99,61.47-16.99,80,0,33.57,9.24,62.03,16.99,80,8.42,19.52,16.82,31.06,17.17,31.55l1.8,2.45M372,3962.11h2522v-1221H372v1221M2919,2451.11H347s-53,55-53,148c0,68.65,28.88,116.59,44,136.99v1260.01h2590v-1260.01c15.12-20.4,44-68.34,44-136.99,0-93-53-148-53-148h0ZM367,2707.11s-33-45-33-108,33-108,33-108h2532s33,45,33,108-33,108-33,108H367ZM378,3956.11v-1209h2510v1209H378Z"
              />
            </g>
          </g>
        </g>
        <g id="Title">
          <path
            className="cls-5"
            d="M348.32,608.11c-3.1-3.46-14.25-16.57-25.27-37.72-11.88-22.82-26.05-59.95-26.05-107.28s14.17-84.46,26.05-107.28c11.02-21.16,22.17-34.26,25.27-37.72h2569.36c3.1,3.46,14.25,16.57,25.27,37.72,11.88,22.82,26.05,59.95,26.05,107.28s-14.17,84.46-26.05,107.28c-11.02,21.16-22.17,34.26-25.27,37.72H348.32ZM364.58,353.33c-1.37,1.87-33.58,46.52-33.58,109.77s32.21,107.9,33.58,109.77l.9,1.23h2535.04l.9-1.23c1.37-1.87,33.58-46.52,33.58-109.77s-32.21-107.9-33.58-109.77l-.9-1.23H365.48l-.9,1.23Z"
          />
          <path
            className="cls-6"
            d="M2916.33,321.11c3.89,4.48,14.04,17,24.07,36.32,11.68,22.48,25.6,59.07,25.6,105.68s-13.92,83.2-25.6,105.68c-10.04,19.32-20.19,31.84-24.07,36.32H349.67c-3.89-4.48-14.04-17-24.07-36.32-11.68-22.48-25.6-59.07-25.6-105.68s13.92-83.2,25.6-105.68c10.04-19.32,20.19-31.84,24.07-36.32h2566.65M363.96,577.11h2538.08l1.8-2.45c.35-.48,8.75-12.02,17.17-31.55,14.04-32.55,16.99-61.47,16.99-80,0-33.57-9.24-62.03-16.99-80-8.42-19.52-16.82-31.06-17.17-31.55l-1.8-2.45H363.96l-1.8,2.45c-.35.48-8.75,12.02-17.17,31.55-14.04,32.55-16.99,61.47-16.99,80,0,33.57,9.24,62.03,16.99,80,8.42,19.52,16.82,31.06,17.17,31.55l1.8,2.45M2919,315.11H347s-53,55-53,148,53,148,53,148h2572s53-55,53-148-53-148-53-148h0ZM367,571.11s-33-45-33-108,33-108,33-108h2532s33,45,33,108-33,108-33,108H367Z"
          />
        </g>
      </g>
      <g id="Title-2" data-name="Title">
        <g id="Textbox-3" data-name="Textbox" className="cls-13">
          <path
            className="cls-10"
            d="M2899,571.11H367s-33-45-33-108,33-108,33-108h2532s33,45,33,108-33,108-33,108Z"
          />
        </g>
        <path
          id="Shadow-2"
          data-name="Shadow"
          className="cls-3"
          d="M2885,554.11H381s-25-28-25-91,25-91,25-91l-14-17s-33,45-33,108,33,108,33,108h2532l-14-17Z"
        />
        <path
          id="Highlight-3"
          data-name="Highlight"
          className="cls-2"
          d="M2899,355.11H367l14,17h2504s25,28,25,91-25,91-25,91l14,17s33-45,33-108-33-108-33-108Z"
        />
      </g>
      {cardName && (
        <text
          x="400"
          y="510"
          fontSize="150"
          fontFamily="Beleren"
          fill="#FFF"
          fontWeight="bold"
          data-testid="card-name"
        >
          {cardName}
        </text>
      )}
      {manaCost &&
        parseMana(manaCost).map((pip, i, pips) => {
          const startX =
            MANA_PIP_RIGHT_ANCHOR - (pips.length - 1) * MANA_PIP_SPACING;
          const cx = startX + i * MANA_PIP_SPACING;
          return (
            <g key={i} data-testid={`mana-pip-${i}`}>
              <circle
                cx={cx}
                cy={MANA_PIP_Y}
                r={MANA_PIP_RADIUS}
                fill={getManaPipColor(pip)}
              />
              <text
                x={cx}
                y={MANA_PIP_Y + 50}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="135"
                fontFamily="Mana"
              >
                {pip}
              </text>
            </g>
          );
        })}
      {typeLine && (
        <text
          x="400"
          y="2636"
          fontSize="120"
          fontFamily="Beleren"
          fill="#fff"
          data-testid="card-type-line"
        >
          {typeLine}
        </text>
      )}
      {oracleText && (
        <foreignObject
          x="430"
          y="2800"
          width="2404"
          height="1100"
          data-testid="card-oracle-text"
        >
          <div
            style={{
              fontSize: "100px",
              fontFamily: "Plantin",
              color: "#fff",
              padding: "40px",
              lineHeight: 1.2,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {oracleText}
          </div>
        </foreignObject>
      )}
    </svg>
  );
};
