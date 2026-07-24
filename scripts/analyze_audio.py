import os
import json
import numpy as np
import librosa
import glob

def analyze_audio_files(directory):
    frequencies = {}
    
    # Get all mp3 files
    mp3_files = glob.glob(os.path.join(directory, '*.mp3'))
    
    for file_path in mp3_files:
        try:
            # Load the audio file
            y, sr = librosa.load(file_path, sr=None)
            
            # Use piptrack (pitch tracking)
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            
            # Extract the most dominant pitches
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                # Filter out zeroes and unreasonable frequencies for human voice (e.g. outside 50-1000Hz)
                if pitch > 50 and pitch < 1000:
                    pitch_values.append(pitch)
            
            if pitch_values:
                # Get the median pitch to avoid outliers
                median_pitch = float(np.median(pitch_values))
                
                # Use the filename (without extension) as the key
                filename = os.path.basename(file_path).replace('.mp3', '')
                frequencies[filename] = median_pitch
                print(f"Analyzed {filename}: {median_pitch:.2f} Hz")
            else:
                print(f"No valid pitch found for {filename}")
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            
    return frequencies

if __name__ == "__main__":
    audio_dir = "public/calibrador"
    output_file = "src/features/calibrador/utils/audioFrequencies.json"
    
    print("Starting audio analysis...")
    freqs = analyze_audio_files(audio_dir)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(freqs, f, indent=2, sort_keys=True)
        
    print(f"Successfully saved {len(freqs)} frequencies to {output_file}")
