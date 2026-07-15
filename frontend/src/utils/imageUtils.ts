export const handleImageChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setSelectedImage: (file: File | null) => void,
  setPreviewUrl: (url: string) => void,
) => {
  const file = e.target.files?.[0];
  if (file) {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};
