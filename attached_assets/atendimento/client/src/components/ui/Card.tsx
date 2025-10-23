
import "../../styles/theme.css?ver=2025-10-23-10";
import { PropsWithChildren } from "react";
export function Card({children, style}:PropsWithChildren<{style?:React.CSSProperties}>){
  return <div className="card" style={style}>{children}</div>;
}
