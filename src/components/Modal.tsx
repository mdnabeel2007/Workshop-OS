import React from "react";

export default function Modal({ title, children, onClose, wide=false }: {title:string;children:React.ReactNode;onClose:()=>void;wide?:boolean}) {
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div className={`modal ${wide?"modal-wide":""}`}>
      <div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}>×</button></div>
      <div className="modal-body">{children}</div>
    </div>
  </div>;
}
