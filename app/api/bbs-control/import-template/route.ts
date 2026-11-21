import{NextResponse}from"next/server";
import{getBackOfficeUser}from"../../../../lib/bbs-control/supabase-server";
import{importFields,toCsv,type ImportKind}from"../../../../lib/bbs-control/csv";
export async function GET(request:Request){if(!await getBackOfficeUser())return NextResponse.json({message:"No autorizado."},{status:401});const kind=new URL(request.url).searchParams.get("kind")as ImportKind;if(!(kind in importFields))return NextResponse.json({message:"Tipo inválido."},{status:400});return new NextResponse(toCsv([[...importFields[kind]]]),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="plantilla-${kind}.csv"`,"Cache-Control":"no-store"}});}
