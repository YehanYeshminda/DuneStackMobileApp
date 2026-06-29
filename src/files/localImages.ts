import { Directory, File, Paths } from 'expo-file-system';

export const saveCapturedImage = async (sourceUri: string): Promise<string> => {
  const directory = getImageDirectory();

  if (!directory.exists) {
    directory.create({ idempotent: true, intermediates: true });
  }

  const sourceFile = new File(sourceUri);
  const destinationFile = new File(directory, createImageName(sourceUri));

  await sourceFile.copy(destinationFile);

  return destinationFile.uri;
};

export const deleteLocalImage = async (imageUri: string): Promise<void> => {
  const imageFile = new File(imageUri);

  if (!imageFile.exists) {
    return;
  }

  imageFile.delete();
};

const getImageDirectory = (): Directory => new Directory(Paths.document, 'places');

const createImageName = (sourceUri: string): string => {
  const extension = sourceUri.split('.').pop();
  const safeExtension = extension === undefined || extension.includes('/') ? 'jpg' : extension;
  const randomValue = Math.random().toString(36).slice(2, 12);
  const timeValue = Date.now().toString(36);

  return `place_${timeValue}_${randomValue}.${safeExtension}`;
};
