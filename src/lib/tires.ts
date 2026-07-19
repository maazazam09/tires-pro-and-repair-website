import { prisma } from "@/lib/prisma";
import { getVerifiedTireSizesForVehicle } from "@/lib/tire-size-fitments";
import { searchWheelSizeByModel } from "@/lib/wheel-size";
import {
  bulkTireProductSizeLinkSchema,
  fitmentPositionSchema,
  tireProductDetailSchema,
  tireProductSizeLinkSchema,
  tireSizeSchema,
  tireSizeTextSchema,
  vehicleFitmentCreateSchema,
  vehicleFitmentUpdateSchema,
} from "@/lib/validators";

type TireSizeInput = {
  size?: string;
  width?: number;
  aspectRatio?: number;
  construction?: string;
  rimDiameter?: number;
  displaySize?: string;
};

type FitmentPosition = "GENERAL" | "FRONT" | "REAR";
type FinderSizeOption = ReturnType<typeof buildFinderSizeOptions>[number];

const tireSizePattern = /^(\d{3})\/(\d{2})(Z?R)(\d{2})$/i;
const tireSizeLoosePattern = /^(?:P|LT)?(\d{3})[\/\-\s]+(\d{2})\s*-?\s*(Z?R)\s*-?\s*(\d{2})(?:C|LT|XL)?$/i;

function cleanName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function parseTireSize(input: TireSizeInput) {
  if (input.size) {
    const size = tireSizeTextSchema.parse(input.size).toUpperCase();
    const match = size.match(tireSizePattern);
    if (!match) throw new Error("Invalid tire-size formatting.");

    const [, width, aspectRatio, construction, rimDiameter] = match;
    return normalizeTireSize({
      width: Number(width),
      aspectRatio: Number(aspectRatio),
      construction,
      rimDiameter: Number(rimDiameter),
      displaySize: input.displaySize || input.size,
    });
  }

  return normalizeTireSize(input);
}

export function normalizeTireSize(input: TireSizeInput) {
  const parsed = tireSizeSchema.parse({
    ...input,
    construction: input.construction || "R",
    displaySize: input.displaySize || `${input.width}/${input.aspectRatio}${input.construction || "R"}${input.rimDiameter}`,
  });
  const construction = parsed.construction.toUpperCase();
  const normalizedConstruction = construction.endsWith("R") ? "R" : construction;

  return {
    ...parsed,
    construction,
    normalizedSize: `${parsed.width}/${parsed.aspectRatio}${normalizedConstruction}${parsed.rimDiameter}`,
  };
}

export async function upsertTireSize(input: TireSizeInput) {
  const size = parseTireSize(input);
  return prisma.tireSize.upsert({
    where: { normalizedSize: size.normalizedSize },
    update: {
      displaySize: size.displaySize || size.normalizedSize,
      construction: size.construction,
      width: size.width,
      aspectRatio: size.aspectRatio,
      rimDiameter: size.rimDiameter,
    },
    create: {
      width: size.width,
      aspectRatio: size.aspectRatio,
      construction: size.construction,
      rimDiameter: size.rimDiameter,
      displaySize: size.displaySize || size.normalizedSize,
      normalizedSize: size.normalizedSize,
    },
  });
}

export async function createVehicleFitment(payload: unknown) {
  const data = vehicleFitmentCreateSchema.parse(payload);
  const makeName = cleanName(data.make);
  const modelName = cleanName(data.model);
  const optionName = cleanName(data.option);

  const result = await prisma.$transaction(async (tx) => {
    const year = await tx.vehicleYear.upsert({
      where: { year: data.year },
      update: {},
      create: { year: data.year },
    });
    const make = await tx.vehicleMake.upsert({
      where: { name: makeName },
      update: {},
      create: { name: makeName },
    });
    const model = await tx.vehicleModel.upsert({
      where: { makeId_name: { makeId: make.id, name: modelName } },
      update: {},
      create: { makeId: make.id, name: modelName },
    });
    const option = await tx.vehicleOption.upsert({
      where: { modelId_name: { modelId: model.id, name: optionName } },
      update: {},
      create: { modelId: model.id, name: optionName },
    });

    const existing = await tx.vehicleFitment.findUnique({
      where: {
        yearId_makeId_modelId_optionId: {
          yearId: year.id,
          makeId: make.id,
          modelId: model.id,
          optionId: option.id,
        },
      },
    });
    if (existing) {
      throw new Error("An exact vehicle fitment record already exists.");
    }

    const fitment = await tx.vehicleFitment.create({
      data: {
        yearId: year.id,
        makeId: make.id,
        modelId: model.id,
        optionId: option.id,
        active: data.active,
      },
    });

    for (const tireSizeInput of data.tireSizes) {
      const size = parseTireSize(tireSizeInput);
      const tireSize = await tx.tireSize.upsert({
        where: { normalizedSize: size.normalizedSize },
        update: {
          displaySize: size.displaySize || size.normalizedSize,
          construction: size.construction,
          width: size.width,
          aspectRatio: size.aspectRatio,
          rimDiameter: size.rimDiameter,
        },
        create: {
          width: size.width,
          aspectRatio: size.aspectRatio,
          construction: size.construction,
          rimDiameter: size.rimDiameter,
          displaySize: size.displaySize || size.normalizedSize,
          normalizedSize: size.normalizedSize,
        },
      });

      await tx.vehicleFitmentTireSize.create({
        data: {
          fitmentId: fitment.id,
          tireSizeId: tireSize.id,
          position: tireSizeInput.position,
        },
      });
    }

    return fitment;
  });

  return getVehicleFitmentById(result.id);
}

export async function updateVehicleFitment(payload: unknown) {
  const data = vehicleFitmentUpdateSchema.parse(payload);
  const makeName = cleanName(data.make);
  const modelName = cleanName(data.model);
  const optionName = cleanName(data.option);

  const result = await prisma.$transaction(async (tx) => {
    const existingFitment = await tx.vehicleFitment.findUnique({ where: { id: data.id } });
    if (!existingFitment) throw new Error("Fitment not found.");

    const year = await tx.vehicleYear.upsert({
      where: { year: data.year },
      update: {},
      create: { year: data.year },
    });
    const make = await tx.vehicleMake.upsert({
      where: { name: makeName },
      update: {},
      create: { name: makeName },
    });
    const model = await tx.vehicleModel.upsert({
      where: { makeId_name: { makeId: make.id, name: modelName } },
      update: {},
      create: { makeId: make.id, name: modelName },
    });
    const option = await tx.vehicleOption.upsert({
      where: { modelId_name: { modelId: model.id, name: optionName } },
      update: {},
      create: { modelId: model.id, name: optionName },
    });

    const duplicate = await tx.vehicleFitment.findUnique({
      where: {
        yearId_makeId_modelId_optionId: {
          yearId: year.id,
          makeId: make.id,
          modelId: model.id,
          optionId: option.id,
        },
      },
    });
    if (duplicate && duplicate.id !== data.id) {
      throw new Error("An exact vehicle fitment record already exists.");
    }

    const fitment = await tx.vehicleFitment.update({
      where: { id: data.id },
      data: {
        yearId: year.id,
        makeId: make.id,
        modelId: model.id,
        optionId: option.id,
        active: data.active,
      },
    });

    await tx.vehicleFitmentTireSize.deleteMany({ where: { fitmentId: data.id } });
    for (const tireSizeInput of data.tireSizes) {
      const size = parseTireSize(tireSizeInput);
      const tireSize = await tx.tireSize.upsert({
        where: { normalizedSize: size.normalizedSize },
        update: {
          displaySize: size.displaySize || size.normalizedSize,
          construction: size.construction,
          width: size.width,
          aspectRatio: size.aspectRatio,
          rimDiameter: size.rimDiameter,
        },
        create: {
          width: size.width,
          aspectRatio: size.aspectRatio,
          construction: size.construction,
          rimDiameter: size.rimDiameter,
          displaySize: size.displaySize || size.normalizedSize,
          normalizedSize: size.normalizedSize,
        },
      });

      await tx.vehicleFitmentTireSize.create({
        data: {
          fitmentId: fitment.id,
          tireSizeId: tireSize.id,
          position: tireSizeInput.position,
        },
      });
    }

    return fitment;
  });

  return getVehicleFitmentById(result.id);
}

export async function deleteVehicleFitment(id: string) {
  if (!id.trim()) throw new Error("Fitment id is required.");
  return prisma.vehicleFitment.delete({ where: { id } });
}

export async function listVehicleFitments(filters: {
  search?: string;
  year?: number;
  make?: string;
  model?: string;
  tireSize?: string;
} = {}) {
  const tireSize = filters.tireSize ? parseTireSize({ size: filters.tireSize }) : null;
  const search = filters.search?.trim();

  return prisma.vehicleFitment.findMany({
    where: {
      ...(filters.year ? { year: { year: filters.year } } : {}),
      ...(filters.make ? { make: { name: { contains: cleanName(filters.make) } } } : {}),
      ...(filters.model ? { model: { name: { contains: cleanName(filters.model) } } } : {}),
      ...(tireSize ? { tireSizes: { some: { tireSize: { normalizedSize: tireSize.normalizedSize } } } } : {}),
      ...(search
        ? {
            OR: [
              { make: { name: { contains: search } } },
              { model: { name: { contains: search } } },
              { option: { name: { contains: search } } },
              { tireSizes: { some: { tireSize: { displaySize: { contains: search } } } } },
            ],
          }
        : {}),
    },
    include: {
      year: true,
      make: true,
      model: true,
      option: true,
      tireSizes: { include: { tireSize: true }, orderBy: { position: "asc" } },
    },
    orderBy: [
      { year: { year: "desc" } },
      { make: { name: "asc" } },
      { model: { name: "asc" } },
      { option: { name: "asc" } },
    ],
    take: 200,
  });
}

export async function getTireFinderOptions(filters: {
  year?: number;
  make?: string;
  model?: string;
  option?: string;
} = {}) {
  const makeName = filters.make ? cleanName(filters.make) : "";
  const modelName = filters.model ? cleanName(filters.model) : "";
  const optionName = filters.option ? cleanName(filters.option) : "";

  const yearsResult = await prisma.vehicleYear.findMany({
    where: { fitments: { some: { active: true } } },
    select: { year: true },
    orderBy: { year: "desc" },
  });

  const makesResult = filters.year
    ? await prisma.vehicleMake.findMany({
        where: {
          fitments: {
            some: {
              active: true,
              year: { year: filters.year },
            },
          },
        },
        select: { name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const modelsResult = filters.year && makeName
    ? await prisma.vehicleModel.findMany({
        where: {
          make: { name: makeName },
          fitments: {
            some: {
              active: true,
              year: { year: filters.year },
              make: { name: makeName },
            },
          },
        },
        select: { name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const optionsResult = filters.year && makeName && modelName
    ? await prisma.vehicleOption.findMany({
        where: {
          model: {
            name: modelName,
            make: { name: makeName },
          },
          fitments: {
            some: {
              active: true,
              year: { year: filters.year },
              make: { name: makeName },
              model: { name: modelName },
            },
          },
        },
        select: { name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const sizeFitments = filters.year && makeName && modelName
    ? await prisma.vehicleFitment.findMany({
        where: {
          active: true,
          year: { year: filters.year },
          make: { name: makeName },
          model: { name: modelName },
          ...(optionName ? { option: { name: optionName } } : {}),
        },
        include: {
          tireSizes: { include: { tireSize: true }, orderBy: { position: "asc" } },
        },
        orderBy: { option: { name: "asc" } },
        take: 100,
      })
    : [];
  let sizeLookupFailed = false;
  let verifiedSizes: FinderSizeOption[] = [];
  if (filters.year && makeName && modelName) {
    const wheelSizeResult = await searchWheelSizeByModel({
      year: filters.year,
      make: makeName,
      model: modelName,
      region: "usdm",
    });

    if (wheelSizeResult.ok) {
      verifiedSizes = wheelSizeResult.sizes.map((size) => ({
        value: sizeToSlug(size),
        label: size,
        type: "square" as const,
        front: size,
        rear: "",
      }));
    } else {
      try {
        verifiedSizes = await getVerifiedTireSizesForVehicle({
          year: filters.year,
          make: makeName,
          model: modelName,
        });
      } catch {
        sizeLookupFailed = true;
      }
    }
  }
  const databaseSizes = sizeFitments.flatMap((fitment) => buildFinderSizeOptions(fitment.tireSizes));

  return {
    years: yearsResult.map((year) => year.year),
    makes: makesResult.map((make) => make.name),
    models: modelsResult.map((model) => model.name),
    options: optionsResult.map((option) => option.name),
    sizes: dedupeByValue([...databaseSizes, ...verifiedSizes])
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
    sizeLookupFailed,
  };
}

function dedupeByValue<T extends { value: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.value)) return false;
    seen.add(item.value);
    return true;
  });
}

function sizeToSlug(size: string) {
  const match = size.toUpperCase().match(tireSizePattern);
  if (!match) return size.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  const [, width, aspectRatio, construction, rimDiameter] = match;
  return `${width}-${aspectRatio}-${construction}-${rimDiameter}`;
}

function parseLooseTireSize(value: string) {
  const decoded = decodeURIComponent(value).trim();
  const match = decoded.match(tireSizeLoosePattern);
  if (!match) throw new Error("Invalid tire-size formatting.");
  const [, width, aspectRatio, construction, rimDiameter] = match;
  return normalizeTireSize({
    width: Number(width),
    aspectRatio: Number(aspectRatio),
    construction,
    rimDiameter: Number(rimDiameter),
    displaySize: `${width}/${aspectRatio}${construction.toUpperCase()}${rimDiameter}`,
  });
}

function parseResultSizeSelection(size: string) {
  const decoded = decodeURIComponent(size).trim();
  const staggeredMatch = decoded.match(/^front-(.+)_rear-(.+)$/i);
  if (staggeredMatch) {
    const [, front, rear] = staggeredMatch;
    return {
      type: "staggered" as const,
      front: parseLooseTireSize(front),
      rear: parseLooseTireSize(rear),
    };
  }

  const square = parseLooseTireSize(decoded);
  return {
    type: "square" as const,
    general: square,
  };
}

function buildFinderSizeOptions(
  tireSizes: Array<{
    position: string;
    tireSize: {
      displaySize: string;
    };
  }>,
) {
  const front = tireSizes.find((link) => link.position === "FRONT")?.tireSize.displaySize;
  const rear = tireSizes.find((link) => link.position === "REAR")?.tireSize.displaySize;
  if (front && rear) {
    return [{
      value: `front-${sizeToSlug(front)}_rear-${sizeToSlug(rear)}`,
      label: `Front ${front} / Rear ${rear}`,
      type: "staggered",
      front,
      rear,
    }];
  }

  return tireSizes
    .filter((link) => link.position === "GENERAL")
    .map((link) => ({
      value: sizeToSlug(link.tireSize.displaySize),
      label: link.tireSize.displaySize,
      type: "square",
      front: link.tireSize.displaySize,
      rear: "",
    }));
}

export async function getVehicleFitmentById(id: string) {
  return prisma.vehicleFitment.findUnique({
    where: { id },
    include: {
      year: true,
      make: true,
      model: true,
      option: true,
      tireSizes: { include: { tireSize: true } },
    },
  });
}

export async function findVehicleFitment(query: {
  year: number;
  make: string;
  model: string;
  option: string;
}) {
  const makeName = cleanName(query.make);
  const modelName = cleanName(query.model);
  const optionName = cleanName(query.option);

  return prisma.vehicleFitment.findFirst({
    where: {
      year: { year: query.year },
      make: { name: makeName },
      model: { name: modelName },
      option: { name: optionName },
    },
    include: {
      year: true,
      make: true,
      model: true,
      option: true,
      tireSizes: { include: { tireSize: true } },
    },
  });
}

async function findVehicleFitmentsForModel(query: {
  year: number;
  make: string;
  model: string;
}) {
  const makeName = cleanName(query.make);
  const modelName = cleanName(query.model);

  return prisma.vehicleFitment.findMany({
    where: {
      active: true,
      year: { year: query.year },
      make: { name: makeName },
      model: { name: modelName },
    },
    include: {
      year: true,
      make: true,
      model: true,
      option: true,
      tireSizes: { include: { tireSize: true } },
    },
    orderBy: { option: { name: "asc" } },
  });
}

export async function getFitmentTireResults(query: {
  year: number;
  make: string;
  model: string;
  option: string;
}) {
  const fitment = await findVehicleFitment(query);
  if (!fitment) return null;

  const grouped: Record<FitmentPosition, typeof fitment.tireSizes> = {
    GENERAL: [],
    FRONT: [],
    REAR: [],
  };
  for (const link of fitment.tireSizes) {
    const position = fitmentPositionSchema.parse(link.position);
    grouped[position].push(link);
  }

  async function productsFor(position: FitmentPosition) {
    const tireSizeIds = grouped[position].map((link) => link.tireSizeId);
    if (tireSizeIds.length === 0) return [];
    return prisma.product.findMany({
      where: {
        category: "TIRE",
        active: true,
        tireSizes: {
          some: {
            tireSizeId: { in: tireSizeIds },
          },
        },
      },
      include: {
        tireDetail: true,
        tireSizes: { include: { tireSize: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return {
    fitment,
    results: {
      general: await productsFor("GENERAL"),
      front: await productsFor("FRONT"),
      rear: await productsFor("REAR"),
    },
  };
}

function isValidVideoUrl(value: string) {
  if (!value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function getTireSearchResults(query: {
  year: number;
  make: string;
  model: string;
  size: string;
  brand?: string;
  season?: string;
  warranty?: string;
  speedRating?: string;
  promotion?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
}) {
  const fitments = await findVehicleFitmentsForModel({
    year: query.year,
    make: query.make,
    model: query.model,
  });
  if (fitments.length === 0) {
    return { fitment: null, selection: null, groups: [], total: 0, invalid: true };
  }

  const selected = parseResultSizeSelection(query.size);
  const tireLinks = fitments.flatMap((fitment) => fitment.tireSizes);
  const pairVerified = selected.type === "staggered"
    ? fitments.some((fitment) => {
        const frontVerified = fitment.tireSizes.some((link) =>
          fitmentPositionSchema.parse(link.position) === "FRONT" &&
          link.tireSize.normalizedSize === selected.front.normalizedSize,
        );
        const rearVerified = fitment.tireSizes.some((link) =>
          fitmentPositionSchema.parse(link.position) === "REAR" &&
          link.tireSize.normalizedSize === selected.rear.normalizedSize,
        );
        return frontVerified && rearVerified;
      })
    : false;

  const page = Math.max(1, query.page || 1);
  const pageSize = Math.min(24, Math.max(1, query.pageSize || 12));
  const skip = (page - 1) * pageSize;

  async function productsFor(label: string, selectedNormalizedSize: string, position: FitmentPosition, verifiedOverride?: boolean) {
    const verified = verifiedOverride ?? tireLinks.some((link) =>
      fitmentPositionSchema.parse(link.position) === position &&
      link.tireSize.normalizedSize === selectedNormalizedSize,
    );
    if (!verified) return { label, size: "", products: [], total: 0, unfilteredTotal: 0, invalid: true };

    const tireSize = tireLinks.find((link) =>
      fitmentPositionSchema.parse(link.position) === position &&
      link.tireSize.normalizedSize === selectedNormalizedSize,
    )?.tireSize;
    const baseWhere = {
      category: "TIRE",
      active: true,
      tireSizes: {
        some: {
          tireSize: { normalizedSize: selectedNormalizedSize },
        },
      },
      tireDetail: {
        is: {
          width: { not: null },
          aspectRatio: { not: null },
          rimDiameter: { not: null },
        },
      },
    };
    const detailFilter = {
      ...baseWhere.tireDetail.is,
      ...(query.season ? { season: query.season } : {}),
      ...(query.speedRating ? { speedRating: query.speedRating } : {}),
      ...(query.promotion ? { promotionAvailable: true, promotionText: { not: "" } } : {}),
      ...warrantyFilter(query.warranty),
    };
    const where = {
      ...baseWhere,
      ...(query.brand ? { brand: query.brand } : {}),
      tireDetail: { is: detailFilter },
    };

    const [products, total, unfilteredTotal, allExactProducts] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          tireDetail: true,
          tireSizes: { include: { tireSize: true } },
        },
        orderBy: sortOrder(query.sort),
        skip,
        take: pageSize,
      }),
      prisma.product.count({ where }),
      prisma.product.count({ where: baseWhere }),
      prisma.product.findMany({
        where: baseWhere,
        include: { tireDetail: true },
        orderBy: [{ brand: "asc" }, { name: "asc" }],
        take: 500,
      }),
    ]);

    return {
      label,
      size: tireSize?.displaySize || selectedNormalizedSize,
      products: products.map((product) => ({
        ...product,
        tireDetail: product.tireDetail
          ? {
              ...product.tireDetail,
              videoUrl: isValidVideoUrl(product.tireDetail.videoUrl) ? product.tireDetail.videoUrl : "",
            }
          : product.tireDetail,
      })),
      total,
      unfilteredTotal,
      facets: buildResultFacets(allExactProducts),
      invalid: false,
    };
  }

  const groups = selected.type === "staggered"
    ? [
        await productsFor("Front Tires", selected.front.normalizedSize, "FRONT", pairVerified),
        await productsFor("Rear Tires", selected.rear.normalizedSize, "REAR", pairVerified),
      ]
    : [await productsFor("Tires", selected.general.normalizedSize, "GENERAL")];

  return {
    fitment: fitments[0],
    selection: selected,
    groups,
    total: groups.reduce((sum, group) => sum + group.total, 0),
    unfilteredTotal: groups.reduce((sum, group) => sum + group.unfilteredTotal, 0),
    facets: mergeResultFacets(groups.flatMap((group) => group.facets ? [group.facets] : [])),
    invalid: groups.some((group) => group.invalid),
    page,
    pageSize,
  };
}

function warrantyFilter(range: string | undefined) {
  if (!range) return {};
  if (range === "under-40000") {
    return { warrantyMiles: { gt: 0, lt: 40000 } };
  }
  if (range === "40000-59999") {
    return { warrantyMiles: { gte: 40000, lt: 60000 } };
  }
  if (range === "60000-plus") {
    return { warrantyMiles: { gte: 60000 } };
  }
  return {};
}

function sortOrder(sort: string | undefined) {
  if (sort === "brand-desc") return [{ brand: "desc" as const }, { name: "asc" as const }];
  if (sort === "model-asc") return [{ tireDetail: { model: "asc" as const } }, { name: "asc" as const }];
  if (sort === "warranty-desc") return [{ tireDetail: { warrantyMiles: "desc" as const } }, { brand: "asc" as const }];
  if (sort === "newest") return [{ createdAt: "desc" as const }];
  return [{ brand: "asc" as const }, { name: "asc" as const }];
}

function buildResultFacets(products: Array<{
  brand: string;
  tireDetail: {
    season: string;
    warrantyMiles: number | null;
    speedRating: string;
    promotionAvailable: boolean;
    promotionText: string;
  } | null;
}>) {
  const brands = [...new Set(products.map((product) => product.brand).filter(Boolean))].sort();
  const seasons = [...new Set(products.map((product) => product.tireDetail?.season.trim()).filter(Boolean) as string[])];
  const speedRatings = [...new Set(products.map((product) => product.tireDetail?.speedRating.trim()).filter(Boolean) as string[])].sort();
  const warrantyMiles = products
    .map((product) => product.tireDetail?.warrantyMiles)
    .filter((value): value is number => typeof value === "number" && value > 0);
  const hasPromotion = products.some((product) => product.tireDetail?.promotionAvailable && product.tireDetail.promotionText.trim());

  return {
    brands,
    seasons: sortSeasons(seasons),
    warrantyRanges: buildWarrantyRanges(warrantyMiles),
    speedRatings,
    hasPromotion,
    hasWarranty: warrantyMiles.length > 0,
  };
}

function mergeResultFacets(facets: ReturnType<typeof buildResultFacets>[]) {
  return {
    brands: [...new Set(facets.flatMap((facet) => facet.brands))].sort(),
    seasons: sortSeasons([...new Set(facets.flatMap((facet) => facet.seasons))]),
    warrantyRanges: mergeWarrantyRanges(facets.flatMap((facet) => facet.warrantyRanges)),
    speedRatings: [...new Set(facets.flatMap((facet) => facet.speedRatings))].sort(),
    hasPromotion: facets.some((facet) => facet.hasPromotion),
    hasWarranty: facets.some((facet) => facet.hasWarranty),
  };
}

function sortSeasons(seasons: string[]) {
  const preferred = ["All Season", "Summer", "Winter"];
  return [...seasons].sort((a, b) => {
    const aIndex = preferred.indexOf(a);
    const bIndex = preferred.indexOf(b);
    if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    return a.localeCompare(b);
  });
}

function buildWarrantyRanges(values: number[]) {
  const ranges = [
    { value: "under-40000", label: "Under 40,000 miles", min: 1, max: 39999 },
    { value: "40000-59999", label: "40,000-59,999 miles", min: 40000, max: 59999 },
    { value: "60000-plus", label: "60,000+ miles", min: 60000, max: Number.POSITIVE_INFINITY },
  ];
  return ranges.filter((range) => values.some((value) => value >= range.min && value <= range.max));
}

function mergeWarrantyRanges(ranges: Array<{ value: string; label: string; min: number; max: number }>) {
  const order = ["under-40000", "40000-59999", "60000-plus"];
  const map = new Map(ranges.map((range) => [range.value, range]));
  return order.flatMap((value) => {
    const range = map.get(value);
    return range ? [range] : [];
  });
}

export async function linkTireProductToSize(payload: unknown) {
  const data = tireProductSizeLinkSchema.parse(payload);
  const product = data.productId
    ? await prisma.product.findUnique({ where: { id: data.productId } })
    : await prisma.product.findUnique({ where: { slug: data.productSlug } });

  if (!product) throw new Error("Product not found.");
  if (product.category !== "TIRE") {
    throw new Error("Only tire products can be linked to tire sizes.");
  }

  const tireSize = await upsertTireSize(data);
  return prisma.tireProductSize.upsert({
    where: {
      productId_tireSizeId: {
        productId: product.id,
        tireSizeId: tireSize.id,
      },
    },
    update: {},
    create: {
      productId: product.id,
      tireSizeId: tireSize.id,
    },
    include: {
      product: true,
      tireSize: true,
    },
  });
}

export async function bulkLinkTireProductsToSize(payload: unknown) {
  const data = bulkTireProductSizeLinkSchema.parse(payload);
  const products = await prisma.product.findMany({
    where: { id: { in: data.productIds } },
    select: { id: true, category: true },
  });
  const foundIds = new Set(products.map((product) => product.id));
  const missing = data.productIds.filter((id) => !foundIds.has(id));
  if (missing.length) throw new Error("One or more selected products were not found.");

  const nonTire = products.find((product) => product.category !== "TIRE");
  if (nonTire) throw new Error("Only tire products can be linked to tire sizes.");

  const tireSize = await upsertTireSize(data);
  return prisma.$transaction(
    products.map((product) =>
      prisma.tireProductSize.upsert({
        where: {
          productId_tireSizeId: {
            productId: product.id,
            tireSizeId: tireSize.id,
          },
        },
        update: {},
        create: {
          productId: product.id,
          tireSizeId: tireSize.id,
        },
      }),
    ),
  );
}

function optionalNumber(value: number | "" | undefined) {
  return value === "" || value === undefined ? null : value;
}

export async function upsertTireProductDetail(productId: string, payload: unknown) {
  const data = tireProductDetailSchema.parse(payload);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found.");
  if (product.category !== "TIRE") throw new Error("Tire details can only be saved for tire products.");

  const detail = {
    model: data.model,
    secondaryImage: data.secondaryImage,
    sku: data.sku,
    width: optionalNumber(data.width),
    aspectRatio: optionalNumber(data.aspectRatio),
    construction: data.construction || "R",
    rimDiameter: optionalNumber(data.rimDiameter),
    tireSize: data.tireSize,
    loadIndex: data.loadIndex,
    speedRating: data.speedRating,
    serviceDescription: data.serviceDescription,
    season: data.season,
    warrantyMiles: optionalNumber(data.warrantyMiles),
    warrantyText: data.warrantyText,
    videoUrl: data.videoUrl,
    promotionAvailable: data.promotionAvailable,
    promotionText: data.promotionText,
    requestQuoteEnabled: data.requestQuoteEnabled,
  };

  const saved = await prisma.tireProductDetail.upsert({
    where: { productId },
    update: detail,
    create: { productId, ...detail },
  });

  if (detail.width && detail.aspectRatio && detail.rimDiameter) {
    await linkTireProductToSize({
      productId,
      width: detail.width,
      aspectRatio: detail.aspectRatio,
      construction: detail.construction,
      rimDiameter: detail.rimDiameter,
      displaySize: detail.tireSize || undefined,
    });
  }

  return saved;
}
