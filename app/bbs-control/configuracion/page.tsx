import {
  BackOfficeCard,
  BackOfficeShell,
  FlashMessage,
  PageHeader,
  PrimaryButton,
  TextArea,
  TextInput,
} from "../components";
import { updateBusinessSettingsAction } from "../actions";
import { defaultBusinessSettings, getBusinessSettings } from "../../../lib/bbs-control/quotes";
import { requireBackOfficeUser } from "../../../lib/bbs-control/supabase-server";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireBackOfficeUser();
  const settings = await getBusinessSettings();
  const isPersisted = settings.id !== "default";

  return (
    <BackOfficeShell user={user}>
      <PageHeader
        description="Estos datos se usan en cotizaciones, PDFs y comunicaciones enviadas desde el panel."
        eyebrow="Configuración"
        title="Configuración de empresa"
      />
      <FlashMessage searchParams={searchParams} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <BackOfficeCard>
          <form action={updateBusinessSettingsAction} className="grid gap-5">
            {isPersisted ? <input name="id" type="hidden" value={settings.id} /> : null}
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-slate-900">
                Nombre comercial
                <TextInput
                  defaultValue={settings.business_name}
                  name="business_name"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-900">
                Razón social
                <TextInput
                  defaultValue={settings.legal_name || settings.business_name}
                  name="legal_name"
                />
              </label>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-slate-900">
                Correo
                <TextInput defaultValue={settings.email || ""} name="email" type="email" />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-900">
                Teléfonos
                <TextInput defaultValue={settings.phone || ""} name="phone" />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-black text-slate-900">
              Dirección
              <TextArea defaultValue={settings.address || ""} name="address" />
            </label>
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="grid gap-2 text-sm font-black text-slate-900">
                Moneda
                <TextInput defaultValue={settings.currency || "USD"} name="currency" required />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-900">
                Prefijo de cotización
                <TextInput defaultValue={settings.quote_prefix || "BBS"} name="quote_prefix" required />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-900">
                Validez por defecto
                <TextInput
                  defaultValue={String(settings.default_validity_days || 30)}
                  min="1"
                  name="default_validity_days"
                  required
                  type="number"
                />
              </label>
            </div>
            <PrimaryButton className="w-fit" type="submit">
              Guardar configuración
            </PrimaryButton>
          </form>
        </BackOfficeCard>
        <BackOfficeCard className="bg-[linear-gradient(180deg,#020617_0%,#063047_100%)] text-white">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
            Vista rápida
          </p>
          <h2 className="mt-4 text-2xl font-black">{settings.business_name}</h2>
          <p className="mt-4 text-sm leading-6 text-slate-200">
            {settings.address || defaultBusinessSettings.address}
          </p>
          <div className="mt-6 grid gap-3 text-sm font-bold text-slate-100">
            <p>{settings.phone || defaultBusinessSettings.phone}</p>
            <p>{settings.email || defaultBusinessSettings.email}</p>
          </div>
          <div className="mt-8 rounded-[8px] border border-cyan-300/20 bg-white/5 p-4 text-sm leading-6 text-slate-200">
            El PDF usa el logo oficial, la marca de agua del isotipo y estos datos. Las redes sociales no se muestran hasta que estén configuradas.
          </div>
        </BackOfficeCard>
      </div>
    </BackOfficeShell>
  );
}
