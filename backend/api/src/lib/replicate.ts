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
  | "traditional";

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
    // adirik/interior-design — best public model for room staging
    model: "adirik/interior-design",
    input: {
      image: imageUrl,
      prompt: `A beautifully staged empty room with ${prompt}`,
      negative_prompt:
        "people, humans, text, watermark, blurry, low quality, distorted",
      prompt_strength: 0.65,
      num_inference_steps: 30,
      guidance_scale: 7.5,
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
        ? (prediction.output as string[])[0]
        : null,
    status: prediction.status as StagingResult["status"],
  };
}
