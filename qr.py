import qrcode

# Fire extinguisher details
data = {
    "S.No": 1,
    "Location": "Reception",
    "Type": "ABC",
    "Weight in Kg": 6,
    "Manufacturing / Refilling Date": "06.06.2024",
    "HPT Date": "05.06.2027",
    "Inspected By": "",
    "Inspection Done on": "",
    "Inspection Due Date": ""
}

# Convert data to string format
data_str = "\n".join([f"{key}: {value}" for key, value in data.items()])

# Generate QR code
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)
qr.add_data(data_str)
qr.make(fit=True)

# Create an image from the QR Code instance
img = qr.make_image(fill_color="black", back_color="white")

# Save the image
img.save("fire_extinguisher_qr.png")

print("QR code generated and saved as fire_extinguisher_qr.png")