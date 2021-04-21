const ws = require('ws');
const fs = require('fs');
const util = require('util');
const events = require('events');
// const RtspClient = require("../rtsp-h264");
const { H264Transport, RTSPClient, RTPPacket } = require('yellowstone');
const EventEmitter = require("events").EventEmitter
const transform = require("sdp-transform");
const H264_HEADER = Buffer.from([0x00, 0x00, 0x00, 0x01]);

class RtspConverter extends EventEmitter {
    constructor(options) {
        super();
        this.setMaxListeners(0);
        this.id = options.id;
        this.url = options.url;
        this.username = options.username;
        this.password = options.password;
        this.client = new RTSPClient(this.username, this.password);

        this.frameTimestamp = undefined;
        this.rtpPackets = [];
        this._headerWritten = false;
        this.videoHead = Buffer.alloc(0);
        // this.client.start();
        // tcp
        this.client.connect(this.url, { connection: "tcp" })
            .then(details => {
                console.log("Connected. Video format is", details.codec);

                // Step 3: Open the output file
                if (details.isH264) {
                    // const file = fs.createWriteStream(this.id);
                    // // Step 4: Create H264Transport passing in the client, file, and details
                    // const h264 = new H264Transport(this.client, file, details);
                }

                if (details != null) {
                    this.processConnectionDetails(details);
                }
                // Step 5: Start streaming!
                this.client.play();
            })
            .catch(e => console.log(e));
        this.inputStreamStarted = true;
        this.client.on("data", (channel, data, packet) => {
            // console.log("RTP:", "Channel=" + channel, "TYPE=" + packet.payloadType, "ID=" + packet.id, "TS=" + packet.timestamp, "M=" + packet.marker);


            if (this._headerWritten) {
                this.processRTPPacket(packet);
            } else {
                this.emit('h264data', this.videoHead);
                this._headerWritten = true;
            }
            // return this.emit(`${this.id}-data`, data);
            // const videoBuffer = Buffer.concat(H264_HEADER, data);
            // return this.emit('h264data', videoBuffer);
        });
        this.client.on("controlData", (err) => {
            // return this.emit(`${this.id}-err`, err);
            // console.log("RTCP:", "Channel=" + channel, "TS=" + rtcpPacket.timestamp, "PT=" + rtcpPacket.packetType);
            return this.emit('exitWithError', err);
        });
    }


    processConnectionDetails(details) {
        // Extract SPS and PPS from the MediaSource part of the SDP
        const fmtp = details.mediaSource.fmtp[0];
        if (!fmtp) {
            return;
        }
        const fmtpConfig = transform.parseParams(fmtp.config);
        const splitSpropParameterSets = fmtpConfig['sprop-parameter-sets'].toString().split(',');
        const sps_base64 = splitSpropParameterSets[0];
        const pps_base64 = splitSpropParameterSets[1];
        const sps = Buffer.from(sps_base64, "base64");
        const pps = Buffer.from(pps_base64, "base64");

        const totalLength = H264_HEADER.length + sps.length + H264_HEADER.length + pps.length;

        this.videoHead = Buffer.concat([H264_HEADER, sps, H264_HEADER, pps], totalLength);
    }
    ;
    processRTPPacket(packet) {
        // Accumatate RTP packets
        this.rtpPackets.push(packet.payload);
        // When Marker is set to 1 pass the group of packets to processRTPFrame()
        if (packet.marker == 1) {
            // console.log('LLLLLLL', packet);
            this.emit('frameTimestamp', packet.timestamp);
            this.frameTimestamp = packet.timestamp;
            this.processRTPFrame(this.rtpPackets);
            this.rtpPackets = [];
        }
    }
    processRTPFrame(rtpPackets) {
        // const header = new RTPPacket();
        const nals = [];
        let partialNal = [];
        for (let i = 0; i < rtpPackets.length; i++) {

            const packet = rtpPackets[i];
            const nal_header_f_bit = (packet[0] >> 7) & 0x01;
            const nal_header_nri = (packet[0] >> 5) & 0x03;
            const nal_header_type = (packet[0] >> 0) & 0x1F;
            if (nal_header_type >= 1 && nal_header_type <= 23) { // Normal NAL. Not fragmented
                nals.push(packet);
            }
            else if (nal_header_type == 24) { // Aggregation type STAP-A. Multiple NAls in one RTP Packet
                let ptr = 1; // start after the nal_header_type which was '24'
                // if we have at least 2 more bytes (the 16 bit size) then consume more data
                while (ptr + 2 < (packet.length - 1)) {
                    let size = (packet[ptr] << 8) + (packet[ptr + 1] << 0);
                    ptr = ptr + 2;
                    nals.push(packet.slice(ptr, ptr + size));
                    ptr = ptr + size;
                }
            }
            else if (nal_header_type == 25) { // STAP-B
                // Not supported
            }
            else if (nal_header_type == 26) { // MTAP-16
                // Not supported
            }
            else if (nal_header_type == 27) { // MTAP-24
                // Not supported
            }
            else if (nal_header_type == 28) { // Frag FU-A
                // NAL is split over several RTP packets
                // Accumulate them in a tempoary buffer
                // Parse Fragmentation Unit Header
                const fu_header_s = (packet[1] >> 7) & 0x01; // start marker
                const fu_header_e = (packet[1] >> 6) & 0x01; // end marker
                const fu_header_r = (packet[1] >> 5) & 0x01; // reserved. should be 0
                const fu_header_type = (packet[1] >> 0) & 0x1F; // Original NAL unit header
                // Check Start and End flags
                if (fu_header_s == 1 && fu_header_e == 0) { // Start of Fragment}
                    const reconstructed_nal_type = (nal_header_f_bit << 7)
                        + (nal_header_nri << 5)
                        + fu_header_type;
                    partialNal = [];
                    partialNal.push(reconstructed_nal_type);
                    // copy the rest of the RTP payload to the temp buffer
                    for (let x = 2; x < packet.length; x++)
                        partialNal.push(packet[x]);
                }
                if (fu_header_s == 0 && fu_header_e == 0) { // Middle part of fragment}
                    for (let x = 2; x < packet.length; x++)
                        partialNal.push(packet[x]);
                }
                if (fu_header_s == 0 && fu_header_e == 1) { // End of fragment}
                    for (let x = 2; x < packet.length; x++)
                        partialNal.push(packet[x]);
                    nals.push(Buffer.from(partialNal));
                }
            }
            else if (nal_header_type == 29) { // Frag FU-B
                // Not supported
            }
        }
        // Write out all the NALs
        for (let x = 0; x < nals.length; x++) {
            const totalLength = H264_HEADER.length + nals[x].length + H264_HEADER.length;
            const videoData = Buffer.concat([H264_HEADER, nals[x], H264_HEADER], totalLength);
            this.emit('h264data', videoData);
        }
    }
}

module.exports = RtspConverter