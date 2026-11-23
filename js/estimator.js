

export function pourcentage(value, dernier) {
   const porsontag = ((value - dernier) / dernier) * 100
   return porsontag;
}