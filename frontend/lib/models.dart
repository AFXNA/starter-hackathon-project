import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';

final AudioRecorder recorder = AudioRecorder();

Future<String?> startRecording() async {
  if (!await recorder.hasPermission()) {
    return null;
  }

  final directory = await getApplicationDocumentsDirectory();
  final path = '${directory.path}/audio_${DateTime.now().millisecondsSinceEpoch}.m4a';

  await recorder.start(
    const RecordConfig(
      encoder: AudioEncoder.aacLc,
      sampleRate: 44100,
      numChannels: 1,
    ),
    path: path,
  );

  return path;
}

Future<String?> stopRecording() async {
  return await recorder.stop();
}