
export function Badge({children}:{children:React.ReactNode}){
  return <span style={{
    background:"var(--brand-800)", color:"#fff", borderRadius:999, padding:"4px 10px",
    fontSize:12, border:"1px solid var(--border)"
  }}>{children}</span>;
}
