import { GetStaticProps } from "next";
import VideoEntry from "../components/VideoEntry";
import { Video } from "../interfaces";
import Layout from "../layout/Layout";
import { getSortedVideoData } from "../lib/api/blog";

interface Props {
  videos: Video[];
}

const VideosPage = ({ videos }: Props) => {
  return (
    <Layout>
      <h1 className="page-title">Videos</h1>
      <div className="video_grid">
        {videos.map((video, index) => (
          <VideoEntry video={video} key={index} featured={index === 0} />
        ))}
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const videos = getSortedVideoData();
  return {
    props: {
      videos
    }
  };
};

export default VideosPage;
