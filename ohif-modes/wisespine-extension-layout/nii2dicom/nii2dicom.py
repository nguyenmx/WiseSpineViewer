"""
Convert a NIfTI vertebrae mask to DICOM SEG format.

Requirements:
    pip install highdicom pydicom nibabel numpy

Usage:
    python nii2dicom.py <nifti_mask> <reference_dicom_dir> <output_file>

Example:
    python nii2dicom.py images/vertebrae_C7.nii/vertebrae_C7.nii images/vertebrae_C7_dcm vertebrae_C7_seg.dcm
"""

import sys
import os
import glob
import numpy as np
import nibabel as nib
import pydicom
import highdicom as hd
from pydicom.sr.codedict import codes


def convert_nii_to_dicom_seg(nifti_path, reference_dcm_dir, output_path):
    # Load the NIfTI mask
    nii = nib.load(nifti_path)
    mask_data = np.array(nii.dataobj, dtype=np.uint8)

    # Load reference DICOM files
    dcm_files = sorted(glob.glob(os.path.join(reference_dcm_dir, '*.dcm')))
    if not dcm_files:
        print(f"No .dcm files found in {reference_dcm_dir}")
        sys.exit(1)

    source_images = [pydicom.dcmread(f) for f in dcm_files]
    print(f"Loaded {len(source_images)} reference DICOM slices")

    # Create binary mask (non-zero = vertebra)
    binary_mask = (mask_data > 0).astype(np.uint8)

    # Reorient mask to match DICOM slice order (axial slices along last axis)
    binary_mask = np.transpose(binary_mask, (1, 0, 2))
    binary_mask = np.flip(binary_mask, axis=2)

    # Define the segment description
    segment_description = hd.seg.SegmentDescription(
        segment_number=1,
        segment_label='Vertebra C7',
        segmented_property_category=codes.SCT.Tissue,
        segmented_property_type=codes.SCT.Bone,
        algorithm_type=hd.seg.SegmentAlgorithmTypeValues.AUTOMATIC,
        algorithm_identification=hd.AlgorithmIdentificationSequence(
            name='TotalSegmentator',
            version='1.0',
        ),
    )

    # Create DICOM SEG
    seg = hd.seg.Segmentation(
        source_images=source_images,
        pixel_array=binary_mask,
        segmentation_type=hd.seg.SegmentationTypeValues.BINARY,
        segment_descriptions=[segment_description],
        series_instance_uid=hd.UID(),
        series_number=100,
        sop_instance_uid=hd.UID(),
        instance_number=1,
        manufacturer='WiseSpine',
        manufacturer_model_name='WiseSpine Segmentation',
        software_versions='0.1',
        device_serial_number='001',
    )

    seg.save_as(output_path)
    print(f"DICOM SEG written to: {output_path}")


if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python nii2dicom.py <nifti_mask> <reference_dicom_dir> <output_file>")
        sys.exit(1)

    convert_nii_to_dicom_seg(sys.argv[1], sys.argv[2], sys.argv[3])
