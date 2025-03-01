import segno
import json

def generate_qr(data, file_name="fire_extinguisher_qr.png"):
    # Convert dictionary to JSON string
    json_data = json.dumps(data)

    # Generate QR code with embedded data
    qr = segno.make(json_data)
    qr.save(file_name, scale=10)
    print(f"QR Code generated and saved as {file_name}")

# Fire Extinguisher Details
fire_extinguisher_data = {
    "Manufacturer": "Seed Fire Safety",
    "Address": "Plot No.1 Shanthi Nagar, Kanchipuram District, Tamil Nadu, India",
    "Contact": "+91 4007 123 456",
    "Extinguisher Type": "CO2",
    "Serial Number": "12345-XYZ",
    "Capacity": "5 KG",
    "Manufacture Date": "2023-06-15",
    "Last Service Date": "2024-02-01",
    "Expiry Date": "2028-12-31",
    "Emergency Contact": "101 (Tamil Nadu Fire Dept.)"
}

# Generate the QR Code
generate_qr(fire_extinguisher_data)
