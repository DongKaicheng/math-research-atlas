# Prescribed interface data and the nonlinear bulk graph

Status: root derivation, pending separate audit. This organizes the clamped graph and the sphere compensator into one constructive statement. It is a restricted actual-source theorem on the original torus, not arbitrary-background C2. No assertion of literature novelty is made.

## 1. Known reference and free parameters

Let W be the known bounded actual reference from `root_extensions.md`, with a C^{2,alpha} strictly convex real profile v on a protected neighborhood of Bbar_R, with D^2v>=cI there. Keep the original field, norm, ordinary representative and S=beta^(n-q)[X], n>=2, 2<=q<=n. Use the already constructed operators

    L=L_v,  N=N_v,  D_v,  T,  E,  K=K_v,  Pi=Pi_v,  Q=Q_v,
    Y_v=L Z.

Here Q is the complementary projection, not the geometric moment box; at a nonquadratic reference its image is not asserted to be ordinary harmonic. This notation is confined to this document.

Choose as free prescribed parameters a small real g in Y_v and a small boundary function psi in C^{1,alpha}(sphere) with psi<=0. They do not come from an assumed nonlinear solution. Epsi is the explicit normal-trace lifting in the main proof.

Let M>=||K|| and suppose the polynomial estimate ||N(h)-N(k)||_Y<=L_*(r)||h-k||_X holds on the radius-r X-ball. Choose r with M L_*(r)<=1/2 and sufficiently small to preserve the strict Hessian and negative-value margins. Require

    ||Epsi||_X + M ||g||_Y <= r/2.                      (P1)

Define the actual iteration

    h_0=Epsi,
    h_(j+1)=Epsi+K[g-N(h_j)].                           (P2)

Every iterate has zero Dirichlet boundary value and normal derivative psi, since K takes values in Z. Because N(0)=0, ||N(h)||<=L_*(r)||h|| on the ball. Thus (P1) and M L_*(r)<=1/2 show that (P2) maps that ball into itself and is a contraction of factor at most 1/2. It converges in C^{2,alpha} to h=h(g,psi), with

    ||h||_X<=2(||Epsi||_X+M||g||_Y),
    ||h-h_j||_X<=2^(1-j)||h_1-h_0||_X,
    ||h_1-h_0||_X<=M(||g||_Y+||N(Epsi)||_Y).            (P3)

For two parameter pairs in the common budget, subtraction gives

    ||h(g,psi)-h(g',psi')||_X
       <=2(||E(psi-psi')||_X+M||g-g'||_Y).              (P4)

These formulas provide a convergent construction and error budget for all angular modes at once.

## 2. The exact bulk datum

Since L K=Pi and Pi g=g, applying L to the fixed point gives

    F_v(h)=g+L Epsi+Q N(h)=:f(g,psi).                   (P5)

The identity Pi L E=0 follows from Pi=L P D_v, D_v L E=E, and P E=0. Consequently Pi f=g. The complementary component L Epsi+Q N(h) is forced by the boundary parameter, rather than being silently discarded. For a supplied small bulk datum f and supplied psi, the necessary and sufficient condition in this small profile class is

    Q f = L Epsi + Q N(h(Pi f,psi)),                    (P6)

with the budget (P1) for Pi f. Necessity follows by applying Pi to the source equation and uniqueness of the contraction; sufficiency is (P5). It is an exact functional condition with geometric approximation bounds, not a finite-step decision test.

## 3. The full original Radon source

Let A_T(x) be the restriction of D^2v(x) to the tangent space of the sphere. The independent boundary-layer calculation in `nonradial_seam_extension.md` supplies

    J_v(psi)(x)=integral_(psi(x))^0
          sigma_(q-1)(A_T(x)+(s/R) I_T) ds.             (P7)

The small norm budget makes both endpoint tangent matrices strictly positive. Since psi<=0, J_v(psi)>=0, and it is zero exactly where psi=0. Zero extension of h is continuous. The jump of its gradient traces is -psi nu and its distribution Hessian has surface part (-psi)nu tensor nu dS; the inside and outside Hessians are positive and this surface Hessian is positive, so the glued potential U=W+tilde h is actual psh. The separate negative-value budget and unchanged exterior give the same bounded actual core qualifications as the parent.

The source equation, on every original compact smooth scalar test, is

    mu_U=mu_W+q!(n-q)! sigma_*[
                 1_B f(g,psi) dx+J_v(psi) dS].         (P8)

The bulk density is positive after adding the reference, by strict convexity; the surface contribution is nonnegative; the exterior is unchanged. This constructs genuine positive Radon data including a prescribed type of singular part. It is not a replacement of the originally supplied datum: (P5) and (P7) explicitly state all components of the datum that this construction realizes.

The proof of (P8) must use the boundary-layer theorem; merely applying the clamped C^{1,1} formula when psi is nonzero would lose the surface measure. The extension is generally Lipschitz and piecewise C^{2,alpha}, not C^1 across the sphere.

## 4. A quadratic reference permits direct prescription of surface density

For the parent's quadratic reference v=|x|^2/2, A_T=I_T and

    J(psi)=C1 R/q [1-(1+psi/R)^q],
    C1=binom(n-1,q-1).

Hence any sufficiently small prescribed nonnegative s in C^{1,alpha}(sphere) has the explicit boundary parameter

    psi_s=R[(1-q s/(C1 R))^(1/q)-1] <=0.                (P9)

Here s is the normalized real Hessian surface density: its actual non-Archimedean measure is q!(n-q)! sigma_*(s dS). Choose s small enough that the positive radicand and the norm budget (P1) hold. Independently choose small g with zero moments against every harmonic polynomial on the ball. Then (P2), using K_v=K_quadratic/C1, gives an actual source with precisely that surface component and normalized bulk density

    f(g,s)=g+C1 Delta Epsi_s+Q N(h(g,psi_s)).            (P10)

At s=0 this is the clamped harmonic graph. At constant psi=-tR and g=0, Epsi=-t(|x|^2-R^2)/2 has constant Hessian, N(Epsi) is constant harmonic, and the projected nonlinear correction vanishes. The construction recovers exactly u_t=w+t(R^2-|x|^2)/2 in the ball, including the total-mass compensation from `order_ideal_interface.md`.

The nonquadratic formula (P7) is still explicit in a prescribed psi. Do not automatically claim that C^{1,alpha} surface density can be inverted to C^{1,alpha} psi when v is only C^{2,alpha}: the coefficient A_T then has only C^alpha regularity. Direct surface-density inversion at that regularity is not included. Extra reference regularity would have to be specified and checked.

## 5. What this does and does not accomplish

The construction supplies an infinite-dimensional nonlinear range with independently prescribed linear bulk component and interface component, an actual convergent potential algorithm, and a full-original-test source identity. It avoids the earlier false step of feeding unprojected nonlinear residuals into a compact linear inverse. The surface family also shows why the clamped principal ideal does not exhaust every strong neighborhood of compatible potentials.

The original general C2 problem is still open: no arbitrary positive Radon data theorem, no arbitrary current-background inverse, and no quotient/refinement descent mechanism is obtained. The construction uses a known strictly elliptic real moment profile and a specified smooth toric background. Any Xi=0 conclusion is only the already frozen consequence of this actual source construction under its exact hypotheses.
