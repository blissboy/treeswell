// // import WebMidi from 'test/webmidi';





document.addEventListener("DOMContentLoaded", function () {

  // WebMidi.enable(function(err) {
  //
  //   if (err) throw "WebMidi couldn't be enabled: ";
  //
  //   console.log(WebMidi.inputs);
  //   console.log(WebMidi.outputs);
  //
  //   // WebMidi.inputs.forEach(function (input) {
  //   //   input.addListener("noteon", function (e) {
  //   //     console.log(e);
  //   //   })
  //   // });
  //
  //   // var kbd = WebMidi.inputs[0];
  //   // var toSynth = WebMidi.getOutputByName("MIDI Monitor");
  //   //
  //   // kbd.addListener('noteon', "all", function (e) {
  //   //   console.log(e);
  //   //   toSynth.playNote(e.note.number, 8);
  //   // });
  //   //
  //   // kbd.addListener('noteoff', "all", function (e) {
  //   //   console.log(e);
  //   //   toSynth.stopNote(e.note.number, 8);
  //   // });
  //
  //   // WebMidi.outputs[0].sendSysex(0x42, [1, 2, 3, 4, 5]);
  //
  // }, true)



  // WebMidi.enable(function(err) {
  //
  //   if(err) {
  //     console.log("WebMidi cannot be enabled!");
  //   } else {
  //     console.log("WebMidi enabled!");
  //
  //     // create dropdown for MIDI output select
  //     // let controls = document.getElementById("controls");
  //     // let select = document.createElement("select");
  //     // select.id = "midiOut";
  //     // select.setAttribute("onchange", "midiPortSelect(this.value)");
  //     // controls.appendChild(select);
  //     for(i = 0; i < WebMidi.outputs.length; i ++) {
  //       console.log("output: " + WebMidi.outputs[i].name);
  // //       let option = document.createElement("option");
  // //       option.appendChild(document.createTextNode(WebMidi.outputs[i].name));
  // //       select.appendChild(option);
  //     }
  //
  //   }
  //
  // }, true);

  WebMidi.enable( function(error) {

    if(error) console.log("WebMidi Error:", error);

    WebMidi.inputs.forEach(function(input) {

      input.addListener(
        /* type     */ "noteon",
        /* channel  */ "all",
        /* callback */  function(event){ console.log(`NoteOn:  ${event.note.name}${event.note.octave}`)}
      );

      input.addListener(
        /* type     */ "noteoff",
        /* channel  */ "all",
        /* callback */  function(event){console.log(`NoteOff: ${event.note.name}${event.note.octave}`)}
      );

      input.addListener(
        /* type     */ "controlchange",
        /* channel  */ "all",
        /* callback */  function(event){console.log(`CC:      ${event.controller.number}.${event.value}`)}
      )

    });



  })


});

