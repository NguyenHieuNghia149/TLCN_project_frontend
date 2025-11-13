import React from 'react'

interface VideoPlayerProps {
  videoUrl: string
  title?: string
}

type VideoPlatform = 'youtube' | 'vimeo' | 'dailymotion' | 'twitch' | 'unknown'

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title = 'Video Player',
}) => {
  // Detect video platform and extract video ID
  const detectPlatform = (
    url: string
  ): { platform: VideoPlatform; videoId: string } => {
    // YouTube patterns
    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ]

    for (const pattern of youtubePatterns) {
      const match = url.match(pattern)
      if (match) {
        return { platform: 'youtube', videoId: match[1] }
      }
    }

    // Vimeo patterns
    const vimeoPatterns = [
      /vimeo\.com\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/,
    ]

    for (const pattern of vimeoPatterns) {
      const match = url.match(pattern)
      if (match) {
        return { platform: 'vimeo', videoId: match[1] }
      }
    }

    // Dailymotion patterns
    const dailymotionPatterns = [
      /dailymotion\.com\/video\/([^_]+)/,
      /dai\.ly\/([^_]+)/,
    ]

    for (const pattern of dailymotionPatterns) {
      const match = url.match(pattern)
      if (match) {
        return { platform: 'dailymotion', videoId: match[1] }
      }
    }

    // Twitch patterns
    const twitchPatterns = [/twitch\.tv\/videos\/(\d+)/, /twitch\.tv\/([^/]+)/]

    for (const pattern of twitchPatterns) {
      const match = url.match(pattern)
      if (match) {
        return { platform: 'twitch', videoId: match[1] }
      }
    }

    // If it's already just a video ID (11 characters), assume YouTube
    if (url.length === 11 && !url.includes('.') && !url.includes('/')) {
      return { platform: 'youtube', videoId: url }
    }

    return { platform: 'unknown', videoId: url }
  }

  const { platform, videoId } = detectPlatform(videoUrl)

  // Generate embed URL based on platform
  const getEmbedUrl = (platform: VideoPlatform, videoId: string): string => {
    switch (platform) {
      case 'youtube':
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0`

      case 'vimeo':
        return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&autoplay=0`

      case 'dailymotion':
        return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=0`

      case 'twitch':
        // Check if it's a video ID (numeric) or channel name
        if (/^\d+$/.test(videoId)) {
          return `https://player.twitch.tv/?video=${videoId}&parent=${window.location.hostname}`
        } else {
          return `https://player.twitch.tv/?channel=${videoId}&parent=${window.location.hostname}`
        }

      default:
        // For unknown platforms, try to use the URL directly
        return videoUrl
    }
  }

  const embedUrl = getEmbedUrl(platform, videoId)

  // If it's an unknown platform and not a valid embed URL, show error
  if (
    platform === 'unknown' &&
    !embedUrl.includes('embed') &&
    !embedUrl.includes('player')
  ) {
    return (
      <div className="video-container">
        <div className="flex h-full items-center justify-center bg-gray-800 text-white">
          <div className="text-center">
            <p className="mb-2 text-lg font-semibold">
              Unsupported Video Platform
            </p>
            <p className="text-sm text-gray-400">
              This video platform is not supported yet.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Supported: YouTube, Vimeo, Dailymotion, Twitch
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="video-container">
      <iframe
        src={embedUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full"
      ></iframe>
    </div>
  )
}

export default VideoPlayer
