/**
 * Tipi condivisi dal dominio "brief creativo".
 * Rispecchiano la struttura JSON richiesta dal flusso Step 1 (analisi copy/URL).
 */

export type Placement = 'feed' | 'stories' | 'reels';

export type FunnelStage = 'cold' | 'warm';

export type MessageType =
  | 'benefit-focused'
  | 'proof-based'
  | 'price-based'
  | 'urgency-based';

/** Settori coperti dalla libreria template — deve restare allineato a sector nei file /templates/*.json */
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

/** Input grezzo fornito dall'utente: URL prodotto e/o brief manuale. */
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

/** Dati estratti dallo scraping della URL (se fornita), prima dell'inferenza. */
export interface ScrapedProductData {
  title?: string;
  subtitle?: string;
  benefits: string[];
  price?: string;
  images: string[];
}

/** Il brief strutturato finale, output dello Step 1. */
export interface StructuredBrief {
  target: string;
  objective: string;
  key_message: string;
  dominant_emotion: string;
  suggested_scene: string;
  placement: Placement;
  brand_constraints: BrandConstraints;
  funnel_stage: FunnelStage;
  message_type: MessageType;
  sector?: Sector;
  product_images: string[];
  price?: string;
}

export type AspectRatio = '1:1' | '4:5' | '9:16';

export interface GenerateAiImageRequest {
  brief: StructuredBrief;
  aspectRatio: AspectRatio;
}

export interface GenerateAiImageResponse {
  prompt: string;
}

export interface TemplateLayoutZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TemplateDefinition {
  template_id: string;
  use_case: string;
  sector: string;
  message_type: MessageType;
  layout: {
    canvas: { width: number; height: number };
    zones: Record<string, TemplateLayoutZone>;
  };
  required_fields: string[];
}

export interface GeneratedCopy {
  headline: string;
  subheadline: string;
  benefits: string[];
  cta: string;
  badge_text?: string;
}

export interface GenerateTemplateImageRequest {
  brief: StructuredBrief;
  templateId?: string; // opzionale: se assente, selezione automatica
}

export interface GenerateTemplateImageResponse {
  imageUrl: string;
  templateId: string;
  copy: GeneratedCopy;
}
