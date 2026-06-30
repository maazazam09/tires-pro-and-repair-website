type AdminFieldProps = {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  rows?: number;
  required?: boolean;
  id?: string;
};

export function AdminField({ label, name, defaultValue = "", type = "text", rows, required, id }: AdminFieldProps) {
  const className = "w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground";
  const inputId = id ?? name;
  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm text-metallic">{label}</label>
      {rows ? (
        <textarea id={inputId} name={name} defaultValue={defaultValue} rows={rows} required={required} className={className} />
      ) : (
        <input id={inputId} name={name} type={type} defaultValue={defaultValue} required={required} className={className} />
      )}
    </div>
  );
}
