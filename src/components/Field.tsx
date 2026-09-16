import React from "react";

type Props = {label:string; value:any; onChange:(v:any)=>void; type?:string; placeholder?:string; required?:boolean; options?:{value:string;label:string}[]; disabled?:boolean; step?:string; min?:string};
export default function Field({label,value,onChange,type="text",placeholder,required,options,disabled,step,min}:Props) {
  return <label className="field">
    <span>{label}{required && <b className="req"> *</b>}</span>
    {options ? <select value={value ?? ""} onChange={e=>onChange(e.target.value)} disabled={disabled}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select> :
    type==="textarea" ? <textarea value={value ?? ""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required} disabled={disabled} /> :
    <input type={type} value={value ?? ""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required} disabled={disabled} step={step} min={min} />}
  </label>;
}
