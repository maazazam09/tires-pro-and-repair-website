import { getProductsForAdmin } from "@/lib/data";
import { listVehicleFitments } from "@/lib/tires";
import { TireFitmentManagerClient } from "./TireFitmentManagerClient";

export default async function TireFitmentManagerPage() {
  const [fitments, products] = await Promise.all([
    listVehicleFitments(),
    getProductsForAdmin(),
  ]);

  const serializedFitments = fitments.map((fitment) => ({
    id: fitment.id,
    active: fitment.active,
    year: fitment.year.year,
    make: fitment.make.name,
    model: fitment.model.name,
    option: fitment.option.name,
    tireSizes: fitment.tireSizes.map((link) => ({
      id: link.id,
      position: link.position as "GENERAL" | "FRONT" | "REAR",
      displaySize: link.tireSize.displaySize,
      normalizedSize: link.tireSize.normalizedSize,
      width: link.tireSize.width,
      aspectRatio: link.tireSize.aspectRatio,
      construction: link.tireSize.construction,
      rimDiameter: link.tireSize.rimDiameter,
    })),
  }));

  const tireProducts = products
    .filter((product) => product.category === "TIRE")
    .map((product) => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      slug: product.slug,
      imageUrl: product.imageUrl,
      currentSizes: product.tireSizes.map((link) => link.tireSize.displaySize),
    }));

  return (
    <TireFitmentManagerClient
      initialFitments={serializedFitments}
      tireProducts={tireProducts}
    />
  );
}
