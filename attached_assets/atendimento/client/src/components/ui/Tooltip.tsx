
import { useState } from "react";
export function Tooltip({label, children}:{label:string, children:React.ReactNode}){
  const [show,setShow]=useState(false);
  return (
    <span style={{position:"relative"}}
      onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {children}
      {show && (
        <span style={{
          position:"absolute", bottom:"120%", left:"50%", transform:"translateX(-50%)",
          background:"#0e3336", color:"#fff", border:"1px solid var(--border)",
          padding:"6px 8px", borderRadius:8, fontSize:12, whiteSpace:"nowrap", zIndex:20
        }}>
          {label}
        </span>
      )}
    </span>
  );
}
