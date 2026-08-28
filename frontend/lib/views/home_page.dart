import 'package:flutter/material.dart';
import 'package:frontend/models.dart';
import 'package:frontend/widgets/greetings.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:frontend/models.dart';
import 'package:http/http.dart' as http;

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {

  bool isRecording = false;

  Future<void> startAudio() async {
    if (isRecording) return;

    final path = await startRecording();

    if (path != null) {
      print("STartttttingggg");
      isRecording = true;
      setState(() {});
    }
  }

  Future<void> stopAudio() async {
    if (!isRecording) return;

    final audioPath = await stopRecording();

    isRecording = false;
    setState(() {});

    if (audioPath != null) {
      print('Recorded: $audioPath');

      // Upload to backend
      await uploadAudio(audioPath);
    }
  }

  Future<void> uploadAudio(audioPath) async {
    final uri = Uri.parse('http://172.20.10.11:5000/webhook?test=Highh');

    final request = http.MultipartRequest('POST', uri);

    request.files.add(
      await http.MultipartFile.fromPath(
        'audio',
        audioPath,
        filename: 'recording.m4a',
      ),
    );

    final response = await request.send();

    print('Response status: ${response.statusCode}');

    if (response.statusCode >= 200 && response.statusCode < 300) {
      print('Audio uploaded successfully');
    } else {
      print('Upload failed: ${response.statusCode}');
    }
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      backgroundColor: Color(0xFF080B14),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        leadingWidth: 200,
        leading: Row(
          children: [
            SizedBox(height: 30,),

            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Colors.blue,
                // image: DecorationImage(image: NetworkImage(""), fit: BoxFit.cover)
              ),
            ),  
            const SizedBox(width: 10,),

            Text("ABCx AI", style: GoogleFonts.jetBrainsMono(fontSize: 25, color: Color(0xFFF8FAFC), fontWeight: FontWeight.bold),)
          ],
        ),
      ),

      body: Stack(
        children: [
          Column(
            children: [
              Greetings(),
              
              Expanded(child: Container()),
          
              Container(
                decoration: BoxDecoration(
                  color: Colors.grey,
                  borderRadius: BorderRadius.only(topLeft: Radius.circular(30), topRight: Radius.circular(30)),
                  gradient: const RadialGradient(
                    center: Alignment(1.15, 0.0),
                    radius: 1.25,
                    colors: [
                      Color(0xFF555555), // bright right corner
                      Color.fromARGB(255, 61, 61, 61),
                        Color.fromARGB(255, 38, 38, 38),
                      Color.fromARGB(255, 26, 26, 26), // almost black
                    ],
                    stops: [0.0, 0.40, 0.65, 1.0],
                  ),
          
                ),
                padding: EdgeInsets.all(16.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextField(
                      style: GoogleFonts.jetBrainsMono(color: Colors.white, fontSize: 20),
                      decoration: InputDecoration(
                        
                        contentPadding: EdgeInsets.all(0),
                        border: OutlineInputBorder(borderSide: BorderSide.none),
                        hintText: "Message AI",
                        hintStyle: GoogleFonts.jetBrainsMono(fontSize: 20, color: Color(0xFFF8FAFC))
                      ),
                    ),
          
                    const SizedBox(height: 20,),
          
                    Row(
                      spacing: 10,
                      children: [
                          Container(
                            decoration: BoxDecoration(
                              border: Border.all(color: Color(0xFF94A3B8)),
                              borderRadius: BorderRadius.circular(20)
                            ),
                            padding: EdgeInsets.all(5),
                            child: Icon(Icons.add, size: 26, color: Color(0xFFF8FAFC),),
                          ),
                          Container(
                            decoration: BoxDecoration(
                              border: Border.all(color: Color(0xFF94A3B8)),
                              borderRadius: BorderRadius.circular(20)
                            ),
                            padding: EdgeInsets.all(5),
                            child: Icon(Icons.attach_file, size: 26, color: Color(0xFFF8FAFC),),
                          ),
                          Container(
                            decoration: BoxDecoration(
                              border: Border.all(color: Color(0xFF94A3B8)),
                              borderRadius: BorderRadius.circular(20)
                            ),
                            padding: EdgeInsets.all(5),
                            child: Icon(Icons.track_changes, size: 26, color: Color(0xFFF8FAFC),),
                          ),
                        Expanded(child: Container()),
                        GestureDetector(
                          onLongPressStart: (_) => startAudio(),
                          onLongPressEnd: (_) => stopAudio(),
                          child: Container(
                            decoration: BoxDecoration(
                              border: Border.all(color: Color(0xFF94A3B8)),
                              borderRadius: BorderRadius.circular(20)
                            ),
                            padding: EdgeInsets.all(5),
                            child: Icon(Icons.mic, size: 26, color: Color(0xFFF8FAFC),),
                          ),
                        )
                      ],
                    )
                  ],
                ),
              )            
            ],
          ),

          isRecording
              ? Positioned(
                  bottom: 100,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: Container(
                      padding: EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.redAccent,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        'Recording...',
                        style: GoogleFonts.jetBrainsMono(color: Colors.white, fontSize: 18),
                      ),
                    ),
                  ),
                )
              : SizedBox.shrink(),
        ],
      ),
    );
  }
}