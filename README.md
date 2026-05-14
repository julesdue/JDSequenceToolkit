# JDSequenceToolkit

JDSequenceToolkit is a UXP-based Adobe Premiere Pro plugin for professional sequence and clip management. It provides a suite of tools to automate repetitive tasks, streamline workflows, and enhance productivity within Premiere Pro.

This toolkit is built with vanilla JavaScript and UXP, ensuring a lightweight footprint and direct access to the Premiere Pro API.

## Features

- **Automated Sequence Creation**: Generate sequences automatically from the contents of a project bin.
- **Bulk Clip & Sequence Export**: Export multiple clips or sequences to Adobe Media Encoder with specified presets.
- **MOGRT Data Population**: Populate Motion Graphics Templates (MOGRTs) with data from a CSV file.
- **Advanced Clip Manipulation**: Perform complex clip operations and manipulations with precision.

## Project Structure

The project is organized into several key directories:

- **`workflows/`**: Contains the main entry points for the plugin's features.
- **`lib/`**: A collection of reusable helper functions and utilities.
- **`docs/`**: Detailed documentation, API references, and guides.
- **`payloads/`**: Version-specific export presets and other resources.
- **`stylesheets/`**: CSS for styling the plugin's user interface.

A more detailed breakdown of the project structure can be found in [docs/project-structure.md](docs/project-structure.md).

## Core Concepts

### Action Pattern

For modifying project state, the toolkit uses a specific pattern to ensure that all changes are grouped into a single undoable action in Premiere Pro. This provides a better user experience by making it easy to revert any changes made by the plugin.

### MOGRT Parameter Modification

The toolkit can modify parameters of Motion Graphics Templates (MOGRTs). It traverses the component chain of a clip to find the desired parameter and then updates its value. This is useful for batch-updating titles, graphics, and other template-based elements.

**Note:** There is a known issue with modifying text parameters in some versions of Premiere Pro. See [docs/mogrt-text-param-mutation-blocking-issue.md](docs/mogrt-text-param-mutation-blocking-issue.md) for more details.

### Version-Aware Resource Loading

The plugin can detect the version of Premiere Pro it is running on and load the appropriate resources (like export presets) from the `payloads/` directory. This ensures compatibility across different versions of Premiere Pro.

## API Reference

The plugin extensively uses the Premiere Pro UXP API. A compact reference of the most commonly used classes and methods is available in [docs/doc_classes.md](docs/doc_classes.md).

For a quick reference on MOGRT manipulation, see [docs/mogrt_uxp_quick_reference_compact.md](docs/mogrt_uxp_quick_reference_compact.md).

## Styling

The user interface is styled to match the look and feel of Adobe Premiere Pro, with support for different themes (Light, Dark, Darkest). The styling guide can be found in [docs/styling-guide.md](docs/styling-guide.md).

## Getting Started

1.  **Installation**: Place the plugin folder in the UXP extensions folder for Premiere Pro.
2.  **Access**: Open the plugin from the `Extensions` menu in Premiere Pro.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.
