import React from 'react'

interface YouTubePlayerProps {
  videoId: string
  title?: string
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  title = 'YouTube Video',
}) => {
  const videoUrl = `https://www.youtube.com/embed/${videoId}`

  return (
    <div className="video-container">
      <iframe
        src={videoUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  )
}

export default YouTubePlayer
