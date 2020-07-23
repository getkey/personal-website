---
tags: ["ffmpeg", "webcam", "microphone", "UNIX", "CLI"]
date: "2015-03-23T19:38:07Z"
lang: "en"
---

# A virtual webcam

There are a lot of fun things you can do with Linux. What I propose you today is to stream an arbitrary video as if it were your webcam and microphone output.

<details>

<summary>See original (before 2018-06-18)</summary>

## Some sort of disclaimer

~~Okay, so the draft of this blog post has been sitting on my hard drive for months now, and if I don't post it yet, I'll never post it. The reason I didn't is because it is incomplete, as there's a tiny something I don't understand. I lost interest in this so I won't look for the solution myself, but if you find it you're welcome to share it with me! Anyway, let's see this.~~

</details>

<ins datetime="2018-06-18">I'd like to thank [Osqui LittleRiver](https://github.com/q2dg) who nicely sent me a mail with [the last missing piece](#sound-only) of this little experiment!</ins>

## Setup a virtual webcam

First, install [v4l2loopback](https://github.com/umlaeute/v4l2loopback). It's a kernel module for Linux we will use to create a virtual webcam.

Then we will check for already existing webcams. Like almost every devices in UNIX, they're located in `/dev/` and their names are `video` followed by a number.
```console
$ ls /dev/ | grep video
video0
```
We see here that I have one webcam: `video0`.

Let's load v4l2loopback:
```console
# modprobe v4l2loopback
```

Now we'll see if our virtual webcam is there:
```console
$ ls /dev/ | grep video
video0
video1
```
Yes, it is!


## Setup a virtual microphone

Actually, we won't create a microphone, we'll create a soundcard. Microphones are handled by soundcards, which deal with the collected data.
To create a virtual soundcard we will proceed similarly as we did with the webcam, first we list the connected soundcards:
```console
$ cat /proc/asound/cards
 0 [Intel          ]: HDA-Intel - HDA Intel
                      HDA Intel at 0xfdff4000 irq 27
 1 [NVidia         ]: HDA-Intel - HDA NVidia
                      HDA NVidia at 0xfcffc000 irq 17
 2 [H2300          ]: USB-Audio - HP Webcam HD 2300
                      Hewlett Packard HP Webcam HD 2300 at usb-0000:00:1a.7-5, high speed
```
As you see, I have three soundcards.

Next we load the kernel module:
```console
# modprobe snd-aloop
```

And then, I got a new soundcard!
```console
$ cat /proc/asound/cards
 0 [Intel          ]: HDA-Intel - HDA Intel
                      HDA Intel at 0xfdff4000 irq 27
 1 [NVidia         ]: HDA-Intel - HDA NVidia
                      HDA NVidia at 0xfcffc000 irq 17
 2 [H2300          ]: USB-Audio - HP Webcam HD 2300
                      Hewlett Packard HP Webcam HD 2300 at usb-0000:00:1a.7-5, high speed
 3 [Loopback       ]: Loopback - Loopback
                      Loopback 1
```
It's the one called Loopback, remember its number: 3.

## Stream video to the virtual webcam

### Video only

We'll use `ffmpeg` to extract a stream from a file and input it to the virtual webcam, in this case `/dev/video1`. You don't have to, but you should read at least its synopsis.

```console
$ ffmpeg -re -i 'your/file.avi' -f v4l2 /dev/video1
```
If it doesn't work, you'll have to explicitly set options for the input file, read `ffmpeg`'s manpage to know those.

### Sound only

<details>

<summary>See original (before 2018-06-18)</summary>

~~Ok, this is the part I'm unsure about. I don't get why I have to specify `,1` in `hw:3,1` . If this setting doesn't work for you, well, try trial and error. And if you know why it's this and not anything else, I'll be glad to hear why!~~

</details>

<ins datetime="2018-06-18">

As we saw before, the ID of soundcard I want to use is 3. But I also have to specify the "device".

The card device is [a configuration](http://www.volkerschatz.com/noise/alsa.html#hardware) in which a soundcard can be. For example, mine supports 7.1, 5.1, 5.0, etc. audio systems, and has a device for each.

`aplay -l` can be used to list the combinations of soundcard/devices. In my case the device is 1, so I'll go for `hw:3,1`.

</ins>

```console
$ ffmpeg -i some/test/file.mp3 -f alsa hw:3,1
```

### Both sound and video

First, list your streams with `ffprobe`, you'll get something like this:
```console
$ ffprobe your/file.avi
Stream #0:0: Video: mpeg4 (Advanced Simple Profile) (XVID / 0x44495658), yuv420p, 512x384 [SAR 1:1 DAR 4:3], 1005 kb/s, 29.97 fps, 29.97 tbr, 29.97 tbn, 29.98 tbc
Stream #0:1: Audio: mp3 (U[0][0][0] / 0x0055), 48000 Hz, stereo, s16p, 133 kb/s
```
It means that the first stream of the first file (`#0:0`) is a video whereas the second (`#0:1`) is the audio stream.

And then you can use this with ffmpeg's option `-map` to specify where to output respectively the video stream and the audio stream:

```console
$ ffmpeg -i "your/file.avi" -map 0:0 -f v4l2 /dev/video1 -map 0:1 -f alsa hw:3,1
```

And that's it! now you have a virtual webcam and a virtual microphone you can use, for example, to stream videos on videochats.
