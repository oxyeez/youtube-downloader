import { Form, ActionPanel, showToast, Toast, Icon, Action } from "@raycast/api";
import ytdl from 'ytdl-core';
import fs from 'fs';
import os from 'os';
import isValidFilename from 'valid-filename';

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
    var home = os.homedir();
    var filepath = home.concat('/Downloads/', name, '.mp4');
    ytdl(url).pipe(fs.createWriteStream(filepath));
  }
  return (
    <Action.SubmitForm
      icon={Icon.Checkmark}
      title="Format"
      onSubmit={download}
    />
  );
}