# JDSequenceToolkit

JDSequenceToolkit is a UXP-based Adobe Premiere Pro plugin for professional sequence and clip management. It provides a suite of tools to automate repetitive tasks, streamline workflows, and enhance productivity within Premiere Pro.

This toolkit is built with vanilla JavaScript and UXP, ensuring a lightweight footprint and direct access to the Premiere Pro API.

## Main Features

- **Automated Sequence Creation**: Generate sequences automatically from the contents of a project bin.
- **Bulk Clip & Sequence Export**: Export multiple clips or sequences to Adobe Media Encoder with specified presets.
- **MOGRT Data Population**: Populate Motion Graphics Templates (MOGRTs) with data from a CSV file.
- **Advanced Clip Manipulation**: Perform complex clip operations and manipulations with precision.

## How to use it

1.  Download the latest release from the [releases page](https://github.com/julesdue/JDSequenceToolkit/releases).
2.  Double click the "jdsequencetoolkit_premierepro.ccx" file, which opens Adobe Creative Cloud, just follow the instructions.
    OR place the file into the coresponding folders of PremierePro.
3.  Open the plugin from the `Extensions` menu in Premiere Pro.

## Project Structure

The project is organized into several key directories:

- **`workflows/`**: Contains the main entry points for the plugin's features.
- **`lib/`**: A collection of reusable helper functions and utilities.
- **`docs/`**: Detailed documentation, API references, and guides.
- **`payloads/`**: Version-specific export presets and other resources.
- **`stylesheets/`**: CSS for styling the plugin's user interface.

A more detailed breakdown of the project structure can be found in [docs/project-structure.md](docs/project-structure.md).

## API Reference

The plugin extensively uses the Premiere Pro UXP API. For a detailed reference, please see the [official Adobe Premiere Pro UXP API documentation](https://developer.adobe.com/premiere-pro/uxp/ppro-reference/).

## License

This project is licensed under the MIT License.


