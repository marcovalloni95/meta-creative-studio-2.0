export type Placement = 'feed' | 'stories' | 'reels';
export type AspectRatio = '1:1' | '4:5' | '9:16';
export type Sector =
  | 'dental'
  | 'jewelry'
  | 'real-estate'
  | 'events'
  | 'motorsport'
  | 'professional-services';

export interface BrandConstraints {
  colors?: string[];
  tone?: string;
  logoUsage?: string;
}

export interface RawBriefInput {
  productUrl?: string;
  targetAudience?: string;
  offer?: string;
  mainProblemOrBenefit?: string;
  primaryCta?: string;
  brandConstraints?: BrandConstraints;
  placement?: Placement;
  sector?: Sector;
}

export interface StructuredBrief {
  target: string;
  objective: string;
  key_message: string;
  dominant_emotion: string;
  suggested_scene: string;
  placement: Placement;
  brand_constraints: BrandConstraints;
  funnel_stage: 'cold' | 'warm';
  message_type: 'benefit-focused' | 'proof-based' | 'price-based' | 'urgency-based';
  sector?: Sector;
  product_images: string[];
  price?: string;
}

export interface AnalyzeBriefResponse {
  summary: string;
  editableFields: RawBriefInput;
  structuredBrief: StructuredBrief;
}

export interface GeneratedCopy {
  headline: string;
  subheadline: string;
  benefits: string[];
  cta: string;
  badge_text?: string;
}

export interface GenerateAiImageResponse {
  prompt: string;
}

export interface GenerateTemplateImageResponse {
  imageUrl: string;
  templateId: string;
  copy: GeneratedCopy;
}
