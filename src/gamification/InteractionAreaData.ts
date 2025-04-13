import IsometricScene from "../IsometricScene";

/**
 * A configuration object for the clickable button text in an interaction area.
 */
export interface ButtonConfig {
    text: string;      // e.g. "Click for my time at Apple"
    font: string;      // e.g. "Arial" or fontFamilies["header"]
    fontColor: string; // e.g. "#ffffff"
    baseColor: number; // e.g. 0xaa9cff
    hoverColor: number;// e.g. 0x9887fa
}

/**
 * A configuration object for any floating text displayed above the area.
 */
export interface FloatingTextConfig {
    text: string;      // e.g. "Software Engineer Intern\n        @ Apple"
    color: string;     // e.g. "#7340f5"
    font: string;      // e.g. "Arial"
    fontSize: string;  // e.g. "220px"
    offset: {
        x: number;
        y: number;
    };
}

/**
 * A configuration object for a ring/marker drawn around the area.
 */
export interface MarkerInfoConfig {
    baseColor: number; // e.g. 0x9028f7
    radius: number;    // e.g. 40
    locationType: string; // e.g. "Work", "Projects", "Safehouse"
}


export type ResourceBehavior = 'depletable' | 'shop' | 'static' | 'none';


export interface InteractionAreaData {
    // A unique identifier for this area
    id: string;

    // Position and size of the area in the game world
    positionX: number;
    positionY: number;
    width: number;
    height: number;

    // Display name and overlay key (for HTML overlay lookups)
    displayName: string;
    overlayKey: string;

    // Visual styling for the clickable area
    areaBaseColor: number; // e.g. 0xaa9cff
    areaEdgeColor: number;// e.g. 0xc4baff

    // Optional sub-configs:
    buttonConfig?: ButtonConfig;
    floatingText?: FloatingTextConfig;
    markerInfo?: MarkerInfoConfig;

    // Game element info
    gameElementType?: string; // e.g. "fishing", "treasure", or undefined if no spawns
    minigameId?: string;  
    resourceBehavior?: ResourceBehavior; // depletable, shop, or other. defines how we should treat it.


    // A custom callback if the area has a unique interaction (e.g. fireworks)
    customInteraction?: (scene: Phaser.Scene) => void;
}


const projectColor = {
    areaBaseColor: 0x78b0f5,
    areaEdgeColor: 0,
    buttonBaseColor: 0x428ae3,
    buttonHoverColor: 0x78b0f5,
    markerColor: 0x78b0f5
}

const workExpColor = {
    areaBaseColor: 0xae41f2,
    areaEdgeColor: 0,
    buttonBaseColor: 0xaa9cff,
    buttonHoverColor: 0x9887fa,
    markerColor: 0xae41f2
}

export const INTERACTION_AREAS: InteractionAreaData[] = [
    {
        id: "experience-Apple",
        positionX: 10000,
        positionY: 8963,
        width: 3900,
        height: 2000,
        displayName: "Apple",
        overlayKey: "experienceOverlay-Apple",
        areaBaseColor: workExpColor.areaBaseColor,
        areaEdgeColor: workExpColor.areaEdgeColor,

        buttonConfig: {
            text: "Click for my time at Apple",
            font: "Arial",        // or fontFamilies["header"]
            fontColor: "#ffffff",
            baseColor: workExpColor.buttonBaseColor,
            hoverColor: workExpColor.buttonHoverColor
        },
        floatingText: {
            text: "Software Engineer Intern\n        @ Apple",
            color: "#7340f5",
            font: "Arial",
            fontSize: "220px",
            offset: { x: 0, y: -1200 }
        },
        markerInfo: {
            baseColor: workExpColor.markerColor,
            radius: 40,
            locationType: "Work"
        },
        gameElementType: "fishing",
        resourceBehavior: "depletable"
    },
    {
        id: "experience-Teck",
        positionX: 15600,
        positionY: 15800,
        width: 4100,
        height: 2300,
        displayName: "Teck",
        overlayKey: "experienceOverlay-Teck",
        areaBaseColor: workExpColor.areaBaseColor,
        areaEdgeColor: workExpColor.areaEdgeColor,

        buttonConfig: {
            text: "Click for my time at Teck",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: workExpColor.buttonBaseColor,
            hoverColor: workExpColor.buttonHoverColor
        },
        floatingText: {
            text: "Wireless Engineer Co-op\n        @ Teck",
            color: "#1960bd",
            font: "Arial",
            fontSize: "220px",
            offset: { x: 0, y: -1000 }
        },
        markerInfo: {
            baseColor: workExpColor.markerColor,
            radius: 40,
            locationType: "Work"
        },
        gameElementType: "fishing",
        resourceBehavior: "depletable"
    },
    {
        id: "experience-UAlberta",
        positionX: -2064,
        positionY: 16620,
        width: 4100,
        height: 2300,
        displayName: "UAlberta",
        overlayKey: "experienceOverlay-UAlberta",
        areaBaseColor: workExpColor.areaBaseColor,
        areaEdgeColor: workExpColor.areaEdgeColor,

        buttonConfig: {
            text: "Click for my time at UAlberta",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: workExpColor.buttonBaseColor,
            hoverColor: workExpColor.buttonHoverColor
        },
        floatingText: {
            text: "Data Analyst Co-op\n    @ UAlberta",
            color: "#21570a",
            font: "Arial",
            fontSize: "220px",
            offset: { x: 0, y: -1000 }
        },
        markerInfo: {
            baseColor: workExpColor.markerColor,
            radius: 40,
            locationType: "Work"
        },
        gameElementType: "fishing",
        resourceBehavior: "depletable"
    },
    {
        id: "education",
        positionX: 8689,
        positionY: 13200,
        width: 3600,
        height: 2700,
        displayName: "Education",
        overlayKey: "educationOverlay",
        areaBaseColor: 0x21570a,
        areaEdgeColor: 0,

        buttonConfig: {
            text: "Click to see my Education",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: 0x21570a,
            hoverColor: 0x2d6e10
        },
        floatingText: {
            text: "Education: UAlberta",
            color: "#21570a",
            font: "Arial",
            fontSize: "220px",
            offset: { x: 0, y: -1420 }
        },
        markerInfo: {
            baseColor: 0x2d8038,
            radius: 40,
            locationType: "Education"
        },
        gameElementType: "fishing",
        resourceBehavior: "depletable"
    },
    {
        id: "olympicWeightlifting",
        positionX: 7780,
        positionY: 6061,
        width: 2700,
        height: 1700,
        displayName: "Olympic\nWeightlifting",
        overlayKey: "owOverlay",
        areaBaseColor: 0x145b66,
        areaEdgeColor: 0,

        buttonConfig: {
            text: "Click to see Olympic\nWeightlifting Content",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: 0x145b66,
            hoverColor: 0x208999
        },
        floatingText: {
            text: "Olympic Weightlifting",
            color: "#145b66",
            font: "Arial",
            fontSize: "130px",
            offset: { x: 0, y: -600 }
        },
        markerInfo: {
            baseColor: 0xdbaf1f,
            radius: 40,
            locationType: "Oly-Lifting"
        },
        gameElementType: "fishing",
        resourceBehavior: "depletable"
    },
    // -------- Projects --------
    {
        id: "formFitness",
        positionX: 11390,
        positionY: 16569,
        width: 3400,
        height: 2000,
        displayName: "iOS App",
        overlayKey: "ffOverlay",
        areaBaseColor: projectColor.areaBaseColor,
        areaEdgeColor: projectColor.areaEdgeColor,

        buttonConfig: {
            text: "Click to see FormFitness",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: projectColor.buttonBaseColor,
            hoverColor: projectColor.buttonHoverColor
        },
        floatingText: {
            text: "FormFitness",
            color: "#9e4a09",
            font: "Arial",
            fontSize: "130px",
            offset: { x: 0, y: 100 }
        },
        markerInfo: {
            baseColor: projectColor.markerColor,
            radius: 40,
            locationType: "Projects"
        },
        gameElementType: "fishing",
        resourceBehavior: "depletable"
    },
    {
        id: "imageCaptioner",
        positionX: 1021,
        positionY: 21472,
        width: 3400,
        height: 2000,
        displayName: "Image Captioner",
        overlayKey: "icOverlay",
        areaBaseColor: projectColor.areaBaseColor,
        areaEdgeColor: projectColor.areaEdgeColor,

        buttonConfig: {
            text: "Click to see Image Captioner",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: projectColor.buttonBaseColor,
            hoverColor: projectColor.buttonHoverColor
        },
        floatingText: {
            text: "Image Captioner",
            color: "#0a34a8",
            font: "Arial",
            fontSize: "130px",
            offset: { x: 0, y: -800 }
        },
        markerInfo: {
            baseColor: projectColor.markerColor,
            radius: 40,
            locationType: "Projects"
        },
        gameElementType: "fishing",
        resourceBehavior: "depletable"
    },
    {
        id: "aiAsteroids",
        positionX: 5378,
        positionY: 14325,
        width: 3400,
        height: 2000,
        displayName: "Asteroids Bot",
        overlayKey: "abOverlay",
        areaBaseColor: projectColor.areaBaseColor,
        areaEdgeColor: projectColor.areaEdgeColor,

        buttonConfig: {
            text: "Click to see AI Asteroids Bot",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: projectColor.buttonBaseColor,
            hoverColor: projectColor.buttonHoverColor
        },
        floatingText: {
            text: "Asteroids Bot",
            color: "#38375c",
            font: "Arial",
            fontSize: "130px",
            offset: { x: 0, y: -900 }
        },
        markerInfo: {
            baseColor: projectColor.markerColor,
            radius: 40,
            locationType: "Projects"
        },
        gameElementType: "fishing",
        resourceBehavior: "depletable"
    },
    {
        id: "concurrentCLI",
        positionX: -7178,
        positionY: 15667,
        width: 3400,
        height: 2000,
        displayName: "Concurrent Processes",
        overlayKey: "cpOverlay",
        areaBaseColor: projectColor.areaBaseColor,
        areaEdgeColor: projectColor.areaEdgeColor,

        buttonConfig: {
            text: "Click to see Concurrent\nProcess Manager",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: projectColor.buttonBaseColor,
            hoverColor: projectColor.buttonHoverColor
        },
        floatingText: {
            text: "Concurrent Process\n      Manager",
            color: "#38375c",
            font: "Arial",
            fontSize: "130px",
            offset: { x: 0, y: -600 }
        },
        markerInfo: {
            baseColor: projectColor.markerColor,
            radius: 40,
            locationType: "Projects"
        },
        gameElementType: "fishing",
        resourceBehavior: "depletable"
    },
    {
        id: "inventoryManager",
        positionX: 3771,
        positionY: 9288,
        width: 3400,
        height: 2000,
        displayName: "Inventory Manager",
        overlayKey: "imOverlay",
        areaBaseColor: projectColor.areaBaseColor,
        areaEdgeColor: projectColor.areaEdgeColor,

        buttonConfig: {
            text: "Click to see Inventory Manager",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: projectColor.buttonBaseColor,
            hoverColor: projectColor.buttonHoverColor
        },
        floatingText: {
            text: "Inventory Manager\n    [Android]",
            color: "#2a473a",
            font: "Arial",
            fontSize: "130px",
            offset: { x: 0, y: -1000 }
        },
        markerInfo: {
            baseColor: projectColor.markerColor,
            radius: 40,
            locationType: "Projects"
        },
        gameElementType: "fishing",
        resourceBehavior: "depletable"
    },
    {
        id: "safehouse1",
        positionX: 15510,
        positionY: 12315,
        width: 4100,
        height: 2300,
        displayName: "Safehouse",
        overlayKey: "safehouseOverlay",
        areaBaseColor: 0x1689f5,
        areaEdgeColor: 0,

        buttonConfig: {
            text: "Enter Safehouse",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: 0x1689f5,
            hoverColor: 0x34b4eb
        },
        floatingText: {
            text: "Safehouse",
            color: "#42d6ff",
            font: "Arial",
            fontSize: "130px",
            offset: { x: 0, y: -1000 }
        },
        markerInfo: {
            baseColor: 0x000000,
            radius: -1,
            locationType: "Safehouse"
        },
        gameElementType: "safehouse",
        resourceBehavior: "static"
    },
    {
        id: "safehouse2",
        positionX: -11175,
        positionY: 14456,
        width: 4100,
        height: 2300,
        displayName: "Safehouse",
        overlayKey: "safehouseOverlay",
        areaBaseColor: 0x1689f5,
        areaEdgeColor: 0,

        buttonConfig: {
            text: "Enter Safehouse",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: 0x1689f5,
            hoverColor: 0x34b4eb
        },
        floatingText: {
            text: "Safehouse",
            color: "#42d6ff",
            font: "Arial",
            fontSize: "130px",
            offset: { x: 0, y: -1000 }
        },
        markerInfo: {
            baseColor: 0x000000,
            radius: -1,
            locationType: "Safehouse"
        },
        gameElementType: "safehouse",
        resourceBehavior: "static"
    },
    {
        id: "safehouse3",
        positionX: -4596,
        positionY: 9592,
        width: 4100,
        height: 2300,
        displayName: "Safehouse",
        overlayKey: "safehouseOverlay",
        areaBaseColor: 0x1689f5,
        areaEdgeColor: 0,

        buttonConfig: {
            text: "Enter Safehouse",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: 0x1689f5,
            hoverColor: 0x34b4eb
        },
        floatingText: {
            text: "Safehouse",
            color: "#42d6ff",
            font: "Arial",
            fontSize: "130px",
            offset: { x: 0, y: -1000 }
        },
        markerInfo: {
            baseColor: 0x000000,
            radius: -1,
            locationType: "Safehouse"
        },
        gameElementType: "safehouse",
        resourceBehavior: "static"
    },
    {
        id: "shopFisher",
        positionX: -4435,
        positionY: 20736,
        width: 4100,
        height: 2300,
        displayName: "Fisher Shop",
        overlayKey: "shopFisher",
        areaBaseColor: 0x19e683,
        areaEdgeColor: 0,

        buttonConfig: {
            text: "Enter Shop",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: 0x23945e,
            hoverColor: 0x32c780
        },
        floatingText: {
            text: "Fisher Shop",
            color: "#23945e",
            font: "Arial",
            fontSize: "130px",
            offset: { x: 0, y: -1000 }
        },
        markerInfo: {
            baseColor: 0x000000,
            radius: -1,
            locationType: "Shop"
        },
        gameElementType: "shop",
        resourceBehavior: "static"
    },
    {
        id: "fireworks",
        positionX: -12152,
        positionY: 18805,
        width: 3000,
        height: 1500,
        displayName: "",
        overlayKey: "",
        areaBaseColor: 0xa361fa,
        areaEdgeColor: 0,

        buttonConfig: {
            text: "Click me!",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: 0xa361fa,
            hoverColor: 0xc89eff
        },
        customInteraction: (scene: Phaser.Scene) => {
            console.log("Scene instance:", scene.constructor.name);

            const isoScene = scene as IsometricScene; 

            // Get FireworkManager instance from scene
            const fireworkManager = isoScene.getFireworkManager();
            if (!fireworkManager) {
                console.warn("FireworkManager is not initialized.");
                return;
            }

            // Trigger Fireworks
            fireworkManager.createFireworkDisplay(-12152, 18805, 1000);
            console.log("Fireworks triggered!");
        }
    }
];
