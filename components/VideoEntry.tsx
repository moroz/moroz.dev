import { Video } from "../interfaces";
import { formatDate } from "../lib/dateHelpers";

interface Props {
  video: Video;
  featured?: boolean;
}

const VideoEntry = ({ video, featured }: Props) => {
  const { youtube, title, date } = video;
  const thumbnail = `https://img.youtube.com/vi/${youtube}/maxresdefault.jpg`;
  const url = `https://www.youtube.com/watch?v=${youtube}`;

  return (
    <a
      className={`video_entry ${featured ? "video_entry--featured" : ""}`}
      target="_blank"
      rel="noreferrer noopener"
      href={url}
    >
      <img src={thumbnail} alt={title} />
      <div className="video_entry__meta">
        <p className="video_entry__date">{formatDate(date)}</p>
        <p className="video_entry__title">{title}</p>
      </div>
    </a>
  );
};

export default VideoEntry;
