import Link from "next/link";
import { Video } from "../interfaces";
import { formatDate } from "../lib/dateHelpers";

interface Props {
  video: Video;
  featured?: boolean;
}

const VideoEntry = ({ video, featured }: Props) => {
  const { youtube, title, slug, date } = video;
  const thumbnail = `https://img.youtube.com/vi/${youtube}/maxresdefault.jpg`;

  return (
    <Link href={`/videos/${slug}`}>
      <a className={`video_entry ${featured ? "video_entry--featured" : ""}`}>
        <img src={thumbnail} alt={title} />
        <div className="video_entry__meta">
          <p className="video_entry__date">{formatDate(date)}</p>
          <p className="video_entry__title">{title}</p>
        </div>
      </a>
    </Link>
  );
};

export default VideoEntry;
