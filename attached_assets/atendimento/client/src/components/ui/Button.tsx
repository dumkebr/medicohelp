
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" };
export function Button({variant="primary", ...rest}:Props){
  const cls = "btn "+(variant==="primary"?"btn-primary":"btn-outline");
  return <button className={cls} {...rest} />;
}
