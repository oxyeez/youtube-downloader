import { Form, ActionPanel, showToast, Toast, Icon, Action } from "@raycast/api";
import ytdl from "ytdl-core";
import { createWriteStream, chmodSync } from "fs";
import { homedir } from "os";
import isValidFilename from "valid-filename";
var ffmpegPath = require("ffmpeg-static") as string;
import cp from "child_process";

interface FormInput {
  url: string;
  name: string;
}

export default function main() {
  return (
    <Form
      actions={
        <ActionPanel>
          <DownloadAction />
        </ActionPanel>
      }
    >
      <Form.TextField id="url" title="Youtube URL" placeholder="Paste the url of your youtube video here..." />
      <Form.TextField id="name" title="File name" placeholder="Give a name to your file" />
    </Form>
  );
}

function DownloadAction() {
  async function download(values: FormInput) {
    const { url, name } = values;
    if (url.length === 0) {
      showToast({
        style: Toast.Style.Failure,
        title: 'Youtube URL is required',
      });
      return;
    }
    if (name.length === 0) {
      showToast({
        style: Toast.Style.Failure,
        title: 'File name is required',
      });
      return;
    }
    if (!ytdl.validateURL(url)) {
      showToast({
        style: Toast.Style.Failure,
        title: 'Youtube URL seems to be invalid',
      });
      return;
    }
    if (!isValidFilename(name)) {
      showToast({
        style: Toast.Style.Failure,
        title: 'Please enter a valid file name',
      });
      return;
    }

    var home = homedir();
    var filepath = home.concat("/Downloads/" + name + ".mp4");
    let ffmpegProcess = cp.spawn(
      // "/Users/marcelinliehn/.config/raycast/extensions/youtube-downloader/node_modules/ffmpeg-static/ffmpeg",
      ffmpegPath.replace("ffmpeg", "node_modules/ffmpeg-static/ffmpeg"),
      [
        // supress non-crucial messages
        "-loglevel",
        "8",
        "-hide_banner",
        // input audio and video by pipe
        "-i",
        "pipe:3",
        "-i",
        "pipe:4",
        // map audio and video correspondingly
        "-map",
        "0:a",
        "-map",
        "1:v",
        // no need to change the codec
        "-c",
        "copy",
        // output mp4 and pipe
        "-f",
        "matroska",
        "pipe:5",
      ],
      {
        // no popup window for Windows users
        windowsHide: true,
        stdio: [
          // silence stdin/out, forward stderr,
          "inherit",
          "inherit",
          "inherit",
          // and pipe audio, video, output
          "pipe",
          "pipe",
          "pipe",
        ],
      }
    );

    showToast({
      style: Toast.Style.Animated,
      title: 'Downloading...',
    });

    let vid = ytdl(url, { filter: (format) => format.itag === 137 });
    let aud = ytdl(url, { filter: (format) => format.itag === 140 });

    aud.pipe(ffmpegProcess.stdio[3] as NodeJS.WritableStream);
    vid.pipe(ffmpegProcess.stdio[4] as NodeJS.WritableStream);

    var stream = ffmpegProcess.stdio[5]!.pipe(createWriteStream(filepath));
    stream.on('finish', () => {
      showToast({
        style: Toast.Style.Success,
        title: 'Downloaded',
      })
    });   
  }

  
  return <Action.SubmitForm icon={Icon.Checkmark} title="Format" onSubmit={download} />;
}


