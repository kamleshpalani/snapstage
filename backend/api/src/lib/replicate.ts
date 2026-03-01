import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export type StagingStyle =
  | "modern"
  | "scandinavian"
  | "luxury"
  | "coastal"
  | "industrial"
  | "traditional"
  | "bohemian"
  | "japandi"
  | "farmhouse"
  | "art_deco"
  | "mediterranean"
  | "mid_century"
  | "renovation"
  | "declutter";

const STYLE_PROMPTS: Record<StagingStyle, string> = {
  modern:
    "modern interior design, clean lines, neutral color palette, minimalist furniture, contemporary decor, natural light, professional real estate photography",
  scandinavian:
    "scandinavian interior design, hygge, white walls, light wood furniture, cozy textiles, minimalist nordic style, professional real estate photography",
  luxury:
    "luxury interior design, high-end furniture, marble accents, gold fixtures, elegant decor, premium materials, sophisticated ambiance, professional real estate photography",
  coastal:
    "coastal beach house interior design, light blue and white palette, natural textures, driftwood accents, linen fabrics, airy atmosphere, professional real estate photography",
  industrial:
    "industrial interior design, exposed brick, metal accents, leather furniture, raw textures, urban loft aesthetic, warm lighting, professional real estate photography",
  traditional:
    "traditional interior design, classic furniture, warm colors, ornate details, crown molding, timeless elegance, professional real estate photography",
  bohemian:
    "bohemian interior design, eclectic mix of patterns and textures, vibrant colors, macrame wall hangings, layered rugs, plants, vintage furniture, free-spirited atmosphere, professional real estate photography",
  japandi:
    "japandi interior design, Japanese-Scandinavian fusion, wabi-sabi aesthetics, natural wood, muted earthy tones, minimal clutter, paper lanterns, zen-like serenity, professional real estate photography",
  farmhouse:
    "modern farmhouse interior design, shiplap walls, reclaimed wood, neutral whites and grays, vintage accents, cozy textiles, barn-style details, warm and inviting atmosphere, professional real estate photography",
  art_deco:
    "art deco interior design, bold geometric patterns, gold and black accents, mirrored surfaces, velvet upholstery, glamorous lighting, 1920s inspired luxury, professional real estate photography",
  mediterranean:
    "mediterranean interior design, warm terracotta tones, cobalt blue accents, arched doorways, wrought iron details, mosaic tiles, whitewashed walls, rustic wood beams, professional real estate photography",
  mid_century:
    "mid-century modern interior design, retro 1950s-1960s furniture, organic shapes, teak wood, iconic Eames-style chairs, bold accent colors, open floor plan, professional real estate photography",
  renovation:
    "post-renovation interior design, fresh paint, updated fixtures, modern finishes, bright and open space, new hardwood floors, clean and polished look, showing full potential of the property, professional real estate photography",
  declutter:
    "completely empty and clean room, all furniture and items removed, freshly painted white walls, clean bare floors, bright natural light, minimal and neutral, ready for staging, professional real estate photography",
};

export interface StagingResult {
  predictionId: string;
  outputUrl: string | null;
  status: "starting" | "processing" | "succeeded" | "failed";
}

export async function generateStaging(
  imageUrl: string,
  style: StagingStyle,
): Promise<StagingResult> {
  const prompt = STYLE_PROMPTS[style];

  const prediction = await replicate.predictions.create({
    // flux-kontext-pro: official Black Forest Labs image editing model
    model: "black-forest-labs/flux-kontext-pro",
    input: {
      input_image: imageUrl,
      prompt:
        style === "declutter"
          ? `${prompt}. Remove all furniture, clutter and personal items. Keep the exact same room structure, walls, floors, windows and doors.`
          : style === "renovation"
            ? `${prompt}. Keep the same room dimensions and structure but update all surfaces, finishes and fixtures to look freshly renovated.`
            : `Transform this empty room into a beautifully furnished and staged space with ${prompt}. Keep the same room layout, walls, windows and floors. Add furniture, decor, and lighting.`,
      output_quality: 90,
    },
  });

  return {
    predictionId: prediction.id,
    outputUrl: null,
    status: "starting",
  };
}

export async function getPredictionStatus(
  predictionId: string,
): Promise<StagingResult> {
  const prediction = await replicate.predictions.get(predictionId);

  return {
    predictionId: prediction.id,
    outputUrl:
      prediction.status === "succeeded" && prediction.output
        ? typeof prediction.output === "string"
          ? prediction.output
          : (prediction.output as string[])[0]
        : null,
    status: prediction.status as StagingResult["status"],
  };
}
