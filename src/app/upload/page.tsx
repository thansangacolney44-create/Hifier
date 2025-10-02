'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Plus, Minus, Loader2 } from "lucide-react";
import { useFieldArray, useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg", // mp3
  "audio/flac",
  "audio/wav",
  "audio/x-m4a", // for alac
  "audio/ogg",
];
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB

const formSchema = z.object({
  title: z.string().min(1, 'Song title is required.'),
  artists: z.array(z.object({ name: z.string().min(1, 'Artist name is required.') })).min(1, 'At least one artist is required.'),
  album: z.string().min(1, 'Album name is required.'),
  albumCover: z
    .any()
    .refine((files) => files?.length == 1, "Album cover is required.")
    .refine((files) => files?.[0]?.size <= MAX_IMAGE_SIZE, `Max image size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
  musicFile: z
    .any()
    .refine((files) => files?.length == 1, "Music file is required.")
    .refine((files) => files?.[0]?.size <= MAX_AUDIO_SIZE, `Max audio file size is 100MB.`)
    .refine(
        (files) => ACCEPTED_AUDIO_TYPES.includes(files?.[0]?.type),
        "Only .mp3, .flac, .wav, .alac, and .ogg formats are supported."
    ),
  metadata: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      artists: [{ name: '' }],
      album: '',
      metadata: '',
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'artists',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const uploadFile = (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to upload.' });
        return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const albumCoverFile = data.albumCover[0];
      const musicFile = data.musicFile[0];

      const coverPath = `covers/${user.uid}/${Date.now()}-${albumCoverFile.name}`;
      const musicPath = `music/${user.uid}/${Date.now()}-${musicFile.name}`;

      toast({ title: 'Upload Started', description: 'Uploading album cover...' });
      const coverUrl = await uploadFile(albumCoverFile, coverPath);

      toast({ title: 'Processing...', description: 'Uploading music file...' });
      const musicUrl = await uploadFile(musicFile, musicPath);

      toast({ title: 'Finalizing...', description: 'Saving song details...' });

      await addDoc(collection(db, 'songs'), {
        title: data.title,
        artists: data.artists.map(a => a.name),
        album: data.album,
        coverUrl,
        musicUrl,
        userId: user.uid,
        userName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        metadata: data.metadata || '',
      });
      
      toast({
        title: 'Upload Successful!',
        description: `"${data.title}" has been added to your library.`,
      });
      router.push('/');

    } catch (error: any) {
      console.error("Upload process failed", error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const musicFileRef = form.register("musicFile");
  const albumCoverRef = form.register("albumCover");

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Upload Music</CardTitle>
          <CardDescription>
            Share your high-fidelity audio with the community. Please ensure your files meet the quality standards.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Song Details</h3>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Song Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Crimson Horizon" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Artist Name(s)</Label>
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField
                            control={form.control}
                            name={`artists.${index}.name`}
                            render={({ field }) => (
                                <FormItem className='flex-1'>
                                    <FormControl>
                                        <Input placeholder={`e.g., Artist ${index + 1}`} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {fields.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Minus className="h-4 w-4" />
                            </Button>
                        )}
                        {index === fields.length - 1 && (
                            <Button type="button" variant="outline" size="icon" onClick={() => append({ name: '' })}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <FormField
                    control={form.control}
                    name="album"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Album Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Digital Dreams" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Files</h3>
                <FormField
                  control={form.control}
                  name="albumCover"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Album Cover</FormLabel>
                      <FormControl>
                        <Input type="file" accept="image/jpeg,image/png,image/webp" {...albumCoverRef} />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">High-resolution JPG, PNG, or WebP. Max 5MB.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="musicFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Music File</FormLabel>
                      <FormControl>
                        <Input type="file" accept=".flac,.wav,.alac,.mp3,.ogg" {...musicFileRef} />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        Formats: FLAC, WAV, ALAC, OGG, or MP3. Max 100MB.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Metadata (Optional)</h3>
                <FormField
                  control={form.control}
                  name="metadata"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Song Metadata</FormLabel>
                       <FormControl>
                         <Textarea placeholder="Paste song metadata here (e.g., from MusicBrainz)" className="min-h-[100px]" {...field} />
                       </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isUploading && (
                <div className="space-y-2">
                    <Label>Upload Progress</Label>
                    <Progress value={uploadProgress} />
                    <p className='text-sm text-muted-foreground text-center'>{Math.round(uploadProgress)}%</p>
                </div>
              )}

            </CardContent>
            <CardFooter>
              <Button size="lg" className="w-full" type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-5 w-5" />
                    Start Upload
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
