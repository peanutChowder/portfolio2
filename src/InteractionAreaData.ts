import IsometricScene from "./IsometricScene";

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
    areaHoverColor: number;// e.g. 0xc4baff

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

export const INTERACTION_AREAS: InteractionAreaData[] = [
    {
        id: "experience-Apple",
        positionX: 10000,
        positionY: 8963,
        width: 3900,
        height: 2000,
        displayName: "Apple",
        overlayKey: "experienceOverlay-Apple",
        areaBaseColor: 0xaa9cff,
        areaHoverColor: 0xc4baff,

        buttonConfig: {
            text: "Click for my time at Apple",
            font: "Arial",        // or fontFamilies["header"]
            fontColor: "#ffffff",
            baseColor: 0xaa9cff,
            hoverColor: 0x9887fa
        },
        floatingText: {
            text: "Software Engineer Intern\n        @ Apple",
            color: "#7340f5",
            font: "Arial",
            fontSize: "220px",
            offset: { x: 0, y: -1200 }
        },
        markerInfo: {
            baseColor: 0x9028f7,
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
        areaBaseColor: 0x266dc9,
        areaHoverColor: 0x70a3e6,

        buttonConfig: {
            text: "Click for my time at Teck",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: 0x266dc9,
            hoverColor: 0x1960bd
        },
        floatingText: {
            text: "Wireless Engineer Co-op\n        @ Teck",
            color: "#1960bd",
            font: "Arial",
            fontSize: "220px",
            offset: { x: 0, y: -1000 }
        },
        markerInfo: {
            baseColor: 0x9028f7,
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
        areaBaseColor: 0x21570a,
        areaHoverColor: 0x688c58,

        buttonConfig: {
            text: "Click for my time at UAlberta",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: 0x21570a,
            hoverColor: 0x2d6e10
        },
        floatingText: {
            text: "Data Analyst Co-op\n    @ UAlberta",
            color: "#21570a",
            font: "Arial",
            fontSize: "220px",
            offset: { x: 0, y: -1000 }
        },
        markerInfo: {
            baseColor: 0x9028f7,
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
        areaHoverColor: 0x688c58,

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
            baseColor: 0x114a19,
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
        areaHoverColor: 0x43a6b5,

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
    {
        id: "formFitness",
        positionX: 11390,
        positionY: 16569,
        width: 3400,
        height: 2000,
        displayName: "iOS App",
        overlayKey: "ffOverlay",
        areaBaseColor: 0xffa405,
        areaHoverColor: 0xffdb9c,

        buttonConfig: {
            text: "Click to see FormFitness",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: 0xa38b48,
            hoverColor: 0xb89944
        },
        floatingText: {
            text: "FormFitness",
            color: "#9e4a09",
            font: "Arial",
            fontSize: "130px",
            offset: { x: 0, y: 100 }
        },
        markerInfo: {
            baseColor: 0x134aba,
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
        areaBaseColor: 0x03b1fc,
        areaHoverColor: 0x2ad9f7,

        buttonConfig: {
            text: "Click to see Image Captioner",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: 0x03b1fc,
            hoverColor: 0x2ad9f7
        },
        floatingText: {
            text: "Image Captioner",
            color: "#0a34a8",
            font: "Arial",
            fontSize: "130px",
            offset: { x: 0, y: -800 }
        },
        markerInfo: {
            baseColor: 0x134aba,
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
        areaBaseColor: 0x2019e3,
        areaHoverColor: 0x7672e8,

        buttonConfig: {
            text: "Click to see AI Asteroids Bot",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: 0x7672e8,
            hoverColor: 0x9894f7
        },
        floatingText: {
            text: "Asteroids Bot",
            color: "#38375c",
            font: "Arial",
            fontSize: "130px",
            offset: { x: 0, y: -900 }
        },
        markerInfo: {
            baseColor: 0x134aba,
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
        areaBaseColor: 0x063580,
        areaHoverColor: 0x1e66d9,

        buttonConfig: {
            text: "Click to see Concurrent\nProcess Manager",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: 0x063580,
            hoverColor: 0x1e66d9
        },
        floatingText: {
            text: "Concurrent Process\n      Manager",
            color: "#38375c",
            font: "Arial",
            fontSize: "130px",
            offset: { x: 0, y: -600 }
        },
        markerInfo: {
            baseColor: 0x134aba,
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
        areaBaseColor: 0x0fd47b,
        areaHoverColor: 0x69f5cb,

        buttonConfig: {
            text: "Click to see Inventory Manager",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: 0x1b8c59,
            hoverColor: 0x0fd47b
        },
        floatingText: {
            text: "Inventory Manager\n    [Android]",
            color: "#2a473a",
            font: "Arial",
            fontSize: "130px",
            offset: { x: 0, y: -1000 }
        },
        markerInfo: {
            baseColor: 0x134aba,
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
        areaHoverColor: 0x34b4eb,

        buttonConfig: {
            text: "Enter Safehouse",
            font: "Arial",
            fontColor: "#ffffff",
            baseColor: 0x1689f5,
            hoverColor: 0x34b4eb
        },
        floatingText: {
            text: "Safehouse",
            color: "#2a473a",
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
        id: "fireworks",
        positionX: -7159,
        positionY: 19045,
        width: 3000,
        height: 1500,
        displayName: "",
        overlayKey: "",
        areaBaseColor: 0xa361fa,
        areaHoverColor: 0xc89eff,

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
            fireworkManager.createFireworkDisplay(-7159, 19045, 1000);
            console.log("Fireworks triggered!");
        }
    }
];
