export interface ImageUploadResponseDTO {
  /** Chave S3 a persistir no banco (image_url / receipt_url / etc.). */
  key: string;
  /** URL presigned de curta duração para preview imediato. */
  url: string;
}
