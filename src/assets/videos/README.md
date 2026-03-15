# Video Files

This folder contains video files for the home page hero section.

## Files Needed

Add the following video files to this directory:

1. **tesla-video-1.mp4** - First hero video (Tesla driving/movement)
   - Recommended: 1920x1080 resolution or higher
   - Duration: 8-10 seconds
   - Format: MP4 (H.264 codec)

2. **tesla-video-2.mp4** - Second hero video (Tesla features/technology)
   - Recommended: 1920x1080 resolution or higher
   - Duration: 8-10 seconds
   - Format: MP4 (H.264 codec)

## Video Recommendations

- **Aspect Ratio**: 16:9 (recommended for full-screen background)
- **Codec**: H.264 (widely supported)
- **Bitrate**: 4000-6000 kbps for good quality
- **Frame Rate**: 30fps or 60fps
- **File Size**: Keep under 50MB for fast loading

## How to Add Videos

1. Prepare your video files in MP4 format
2. Place them in this folder with the exact names:
   - `tesla-video-1.mp4`
   - `tesla-video-2.mp4`
3. Refresh your browser to see the videos displayed on the home page

## Video Tools

- **FFmpeg**: Convert videos to MP4 format
- **HandBrake**: Easy video conversion GUI
- **Adobe Premiere**: Professional video editing
- **DaVinci Resolve**: Free professional video editor

## Example FFmpeg Command

```bash
ffmpeg -i input.mov -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k output.mp4
```

This will:
- Convert common video formats to MP4
- Compress the video for web (medium quality)
- Keep file size reasonable

---

**Note**: Videos will autoplay, loop, and mute automatically for the best user experience.
