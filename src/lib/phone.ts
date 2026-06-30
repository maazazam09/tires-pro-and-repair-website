export function phoneToRaw(phone: string) {
  return phone.replace(/\D/g, "");
}