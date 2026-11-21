import { z } from "zod";
export const equipmentSchema = z.object({
  client_id:z.uuid("Seleccione un cliente."), description:z.string().trim().min(2).max(500),
  serial_number:z.string().trim().max(150), model:z.string().trim().max(150), brand:z.string().trim().max(150),
  asset_number:z.string().trim().max(150), department:z.string().trim().max(200), address:z.string().trim().max(2000),
});
export const serviceReportSchema = z.object({
  equipment_id:z.uuid(), reported_date:z.iso.date(), scheduled_date:z.iso.date(), completed_date:z.union([z.iso.date(),z.literal("")]),
  next_due_date:z.union([z.iso.date(),z.literal("")]), purchase_order:z.string().max(200),
  service_types:z.array(z.enum(["preventivo","correctivo","instalacion","evaluacion"])).min(1),
  status:z.enum(["programado","en_proceso","completado","cancelado"]),
  condition:z.enum(["funcional","fuera_de_servicio","observacion"]),
  description:z.string().trim().min(2).max(5000), work_performed:z.string().max(10000), observations:z.string().max(10000),
  received_by:z.string().max(200), technician:z.string().trim().min(2).max(200),
  parts:z.array(z.object({catalog:z.string().max(100),description:z.string().min(2).max(1000),quoted:z.boolean(),installed:z.boolean()})).max(100),
}).superRefine((v,c)=>{
  if(v.status==="completado"&&!v.completed_date)c.addIssue({code:"custom",message:"Indique la fecha de finalización."});
  if(v.next_due_date && v.completed_date && v.next_due_date<=v.completed_date)c.addIssue({code:"custom",message:"El próximo mantenimiento debe ser posterior a la finalización."});
});
export type EquipmentInput=z.infer<typeof equipmentSchema>;
export type Equipment=EquipmentInput & {id:string;client_name:string;updated_at:string};
export type ServiceInput=z.infer<typeof serviceReportSchema>;
export type ServiceReport={id:string;number:string;equipment_id:string;equipment_snapshot?:Equipment;payload:ServiceInput;updated_at:string;created_at:string};
export function nextMaintenance(date:string,months=6){
  if(!z.iso.date().safeParse(date).success||!Number.isInteger(months)||months<1||months>120)throw new Error("Fecha o frecuencia inválida.");
  const [y,m,d]=date.split("-").map(Number);const last=new Date(Date.UTC(y,m-1+months+1,0)).getUTCDate();
  return new Date(Date.UTC(y,m-1+months,Math.min(d,last))).toISOString().slice(0,10);
}
export function canUseTemplates(user:{username:string;is_active?:boolean;must_change_password?:boolean}){
  return user.username==="bryanrodriguez" && user.is_active!==false && !user.must_change_password;
}
