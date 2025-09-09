
// =========================
// Estado general del loader
// =========================
let paso = 4; // índice del paso actual en la secuencia
let fallos = 0; // lleva cantidad de intentos fallidos de try
const MAX_FALLOS = 15; // cantidad maxima de fallos antes de forzar salida

// =========================
// Módulo Visual (VI)
// =========================
const VI = {
// Canvas y logoA
cl(gi,p) {
	VI.c(gi, p);
	VI.la(gi, p);
},

// Inicializar canvas
c(gi,p) {
	try {
		const logoDiv = document.querySelector(".webgl-content .logo");
		if (logoDiv) {
		const canvas = document.createElement("canvas");
		canvas.width = 130;
		canvas.height = 130;
			canvas.className = "logo"; // hereda centrado/tamaño del css
		
			/*canvas.style.display = "block";
		canvas.style.margin = "0 auto";
		canvas.style.backgroundColor = "red";
		canvas.style.zIndex = "9999";
		canvas.style.position = "relative";
			
		gi.container.appendChild(canvas);
*/
		gi.loaderCanvas = canvas;
		gi.loaderCtx = canvas.getContext("2d");

logoDiv.replaceWith(canvas);
		}
		paso |= 1 //0b01
	} catch(e) {
		console.error("Error canvas", e);
		if (++fallos >= MAX_FALLOS) {
        	console.warn("Canvas falló demasiadas veces, forzando finalización");
        	paso = 5; // forzar animación final
      		}
	}
},

// Dibujar logo A
la(gi, p) {
	try {
	const logoA = "TemplateData/logoC.png";
	cargarLogo(gi, logoA);
	} catch(e) {
	IntentoError("logo", e, "Error ");
	}
},

// Dibujar partículas
p() {
	// Aquí irá el render de partículas
}
};

// =========================
// Módulo Lógica (LO)
// =========================
const LO = {
	// Actualizar grupo A
	ga() {
		// mover partículas grupo A
	},

	// Interpolar color
	IC() {
		// lógica de interpolación
	}
};

// =========================
// Módulo Progreso Loader (PL)
// =========================
const PL = {
	// Paso 0: esperar a que Module exista
	m(gi,p) {
		if (!gi.Module) return; // no avanza hasta que esté listo
		paso = 0;
	},

	// Paso final: animación y cierre
	pgs(gi, p) {
		const ctx = gi.loaderCtx;
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.beginPath();
		ctx.arc(65, 65, 60 * p, 0, Math.PI * 2);
		ctx.fillStyle = "#4f8cff";
		ctx.fill();

		if (p === 1 && !gi._done) {
			setTimeout(() => {
				gi.loaderCanvas.style.display = "none";
				PL.fpgs(gi, p); // limpiar y entregar control a Unity
			}, 2000);
		}
	},

	// Paso final: animación y cierre por falla
	fpgs(gi, p) {
  		console.warn("Liberando recursos del loader y entregando control a Unity");

		// Ocultar o quitar canvas del loader
  		if (gi.loaderCanvas) {
    			gi.loaderCanvas.remove(); // o style.display = "none"
    			gi.loaderCanvas = null;
  		}

		// Liberar contexto
  		gi.loaderCtx = null;

		try {
	  		// Limpiar datos temporales
  			gi.logoData = null; // si existe
  			gi.particulas = []; // si existe
		} catch(e) {
			console.error("Error logo", e);
		}

  		// Cancelar animaciones/timers
  		if (window.animId) cancelAnimationFrame(window.animId);
  		if (window.timeoutId) clearTimeout(window.timeoutId);

  		// Quitar eventos
  		// window.removeEventListener("resize", onResize);

  		// Marcar como terminado
  		gi._done = true;
	}
};

// =========================
// Secuencia de pasos
// =========================
const pasos = [
	VI.cl, // canvas y logoA
	VI.la, // dibujar logo A
	VI.c, // crear canvas
	PL.pgs, // animar y cerrar
	PL.m, // esperar Module
	PL.fpgs // carga Unity con fallo de canvas y logo
]; // se llena con las funciones en orden

// =========================
// Función que Unity llama
// =========================
function ProgressLoader(gameInstance, progress) {
	pasos[paso](gameInstance, progress);
}





function cargarLogo(gi, logo) {
  const ctx = gi.loaderCtx;
  const img = new Image();
  img.src = logo;
  img.onload = () => {
    if (img.width !== 130 || img.height !== 130) {
      console.error("Logo no es 130x130. Evito escalar para no deformar.");
      return; // o paso = 5 para salida forzada
    }
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0); // dibuja 1:1
    paso |= 0b10; // marcar bit logo listo
  };
  img.onerror = (err) => {
    IntentoError("logo", err, "Error cargando ");
  };
}







function IntentoError(lugar, valor, txto) {
  console.error(txto + lugar, valor);
  if (++fallos >= MAX_FALLOS) {
    console.warn(lugar + " falló demasiadas veces, forzando finalización");
    paso = 5; // forzar animación final
  }
}




















/*function Progress(gameInstance, progress) {
  if (!gameInstance.Module)
    return;
  if (!gameInstance.logo) {
    gameInstance.logo = document.createElement("div");
    gameInstance.logo.className = "logo " + gameInstance.Module.splashScreenStyle;
    gameInstance.container.appendChild(gameInstance.logo);
  }
  if (!gameInstance.progress) {    
    gameInstance.progress = document.createElement("div");
    gameInstance.progress.className = "progress " + gameInstance.Module.splashScreenStyle;
    gameInstance.progress.empty = document.createElement("div");
    gameInstance.progress.empty.className = "empty";
    gameInstance.progress.appendChild(gameInstance.progress.empty);
    gameInstance.progress.full = document.createElement("div");
    gameInstance.progress.full.className = "full";
    gameInstance.progress.appendChild(gameInstance.progress.full);
    gameInstance.container.appendChild(gameInstance.progress);
  }
  gameInstance.progress.full.style.width = (100 * progress) + "%";
  gameInstance.progress.empty.style.width = (100 * (1 - progress)) + "%";
  if (progress == 1)
    gameInstance.logo.style.display = gameInstance.progress.style.display = "none";
}
*/
