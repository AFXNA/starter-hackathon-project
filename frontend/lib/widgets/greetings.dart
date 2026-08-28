import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class Greetings extends StatelessWidget {
  const Greetings({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 200,
          height: 200,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(100),
            color: Color(0xFF101522),
          ),
        ),

        const SizedBox(height: 20,),

          Text("Hello I'm ABCx", style: GoogleFonts.jetBrainsMono(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFFF8FAFC),),),
          Text("Your digital AI partner", style: GoogleFonts.jetBrainsMono(fontSize: 16, fontWeight: FontWeight.w400, color: Color(0xFF94A3B8)),)
      ],
    );
  }
}
