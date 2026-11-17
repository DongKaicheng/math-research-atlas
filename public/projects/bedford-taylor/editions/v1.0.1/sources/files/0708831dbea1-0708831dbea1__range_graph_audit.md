# Independent audit: a clamped projection and nonlinear source graph

Status: PROVED-INTERNAL in the precise real Hölder / fixed torus sector below, subject to the root's final source audit. This is an author-separated internal audit, not peer review or formal verification. It neither proves the original full LI13 nor solves arbitrary-background C2. The analytic ingredients are classical Poisson extension, Dirichlet Schauder theory, and contraction mapping; no originality claim is made.

## 1. Spaces and the linear Dirichlet inverse

Fix n >= 2, 0 < alpha < 1, R > 0, and B = B_R(0). Write

    Y = C^{0,alpha}(Bbar),
    X = {h in C^{2,alpha}(Bbar): h|boundary B = 0},
    Z = {h in X: partial_nu h|boundary B = 0}.

All functions and operators are real. Use usual Banach Hölder norms. Let D:Y -> X be the unique bounded inverse of the positive-sign Laplacian Delta = sum_i partial_ii. This is the classical Dirichlet Schauder isomorphism, not an assumed inverse on a compact-support ideal. A source actually opened by the root is Larry Guth, MIT 18.156 Lecture 7, notes transcribed by Cole Graham, PDF dated February 20, 2015 and hosted with the Spring 2016 course: Theorem 1 and Corollary 1 give existence/uniqueness on a ball, Theorem 2 gives the global C^{2,alpha} estimate, and Proposition 2 gives the Laplacian case. Scaling yields B_R. URL:

https://ocw.mit.edu/courses/18-156-differential-analysis-ii-partial-differential-equations-and-fourier-analysis-spring-2016/091bf989a474217c56f80bbb84cead6e_MIT18_156S16_lec7.pdf

The normal trace T:X -> C^{1,alpha}(partial B), Th = partial_nu h, is bounded.

## 2. An explicit bounded right inverse of normal trace

For psi in C^{1,alpha}(partial B), let Hpsi be its harmonic Poisson extension and set

    Epsi(x) = (|x|^2 - R^2)/(2R) Hpsi(x).                 (G1)

Then E:C^{1,alpha}(partial B) -> X is bounded, TE = identity, and Delta(Epsi) is harmonic. The apparent regularity issue in (G1) is real: one must not simply assert that Hpsi is C^{2,alpha}. It is generally only C^{1,alpha}. The vanishing prefactor supplies the missing derivative.

Here is an explicit justification of the needed regularity, including the Poisson boundary estimate. By scaling take R = 1. The kernel is

    P(x,y) = (1 - |x|^2)/(omega_{n-1} |x-y|^n),

with y on the unit sphere. Near the boundary let delta = 1 - |x| and y0 = x/|x|. The affine function

    ell(y) = psi(y0) + grad_S psi(y0) dot (y-y0)

has |psi(y)-ell(y)| <= C ||psi||_{C^{1,alpha}} |y-y0|^{1+alpha}; this holds locally by the surface Taylor formula and globally after changing C. The Poisson integral reproduces ell, because ell is affine and harmonic. For m = 1,2,3, direct differentiation of P and 1-|x|^2 <= 2|x-y| give

    |D_x^m P(x,y)| <= C_m |x-y|^{1-n-m}.

When |x| >= 1/2, |x-y| is comparable with delta + |y-y0|. Integrating the differentiated kernel against psi-ell gives

    |DHpsi| <= C ||psi||_{C^{1,alpha}},
    |D^2 Hpsi(x)| <= C ||psi||_{C^{1,alpha}} delta^{alpha-1},
    |D^3 Hpsi(x)| <= C ||psi||_{C^{1,alpha}} delta^{alpha-2}. (G2)

For example the near-diagonal integral for order m is bounded by a constant times

    integral_0^1 r^{n-1+alpha} (delta+r)^{1-n-m} dr.

It is bounded for m=1, of order delta^{alpha-1} for m=2, and of order delta^{alpha-2} for m=3. The part of the sphere separated from y0 is bounded uniformly. Interior derivatives are bounded by differentiating the smooth kernel on |x| <= 3/4.

The middle bound in (G2) implies DHpsi is C^{0,alpha} on the closed ball. For completeness, for x,y at separation d small, if their distances from the boundary are at least 2d, integrate D^2Hpsi along the segment; the ball's distance function is concave, so the result is <= C d^alpha. Otherwise both points lie within 3d of the sphere. Move each a distance of order d radially inwards, join the moved points in a region of depth at least c d, and integrate delta^{alpha-1} along the two radial pieces. Each contribution is <= C d^alpha. The interior case and d bounded below are immediate. Thus the gradient extends Hölder continuously; the ordinary Poisson approximate-identity property identifies the function's boundary value with psi. This proves the C^{1,alpha} bound without invoking a missing C^{2,alpha} boundary datum hypothesis.

Let a(x) = (|x|^2-1)/2. Each entry G = a D^2Hpsi tends to zero at the boundary and obeys

    |G| <= C delta^alpha,   |DG| <= C delta^{alpha-1}.      (G3)

These estimates give G in C^{0,alpha}(Bbar), with zero boundary trace. Indeed, when |x-y| >= delta(x)/2, both boundary depths are <= 3|x-y| and the first estimate gives the result. Otherwise the segment stays at comparable depth and the second estimate gives |G(x)-G(y)| <= C delta(x)^{alpha-1}|x-y| <= C |x-y|^alpha.

Now D^2(aHpsi) = (D^2a)Hpsi + Da tensor DHpsi + DHpsi tensor Da + aD^2Hpsi. Every summand is C^{0,alpha} up to the boundary with bounded norm. The interior second derivatives therefore extend continuously, proving Epsi is C^{2,alpha} on the closed ball. Rescaling proves boundedness for general R. Since a = 0 and partial_nu a = 1 on partial B_R, Epsi has boundary value zero and normal derivative psi. Finally

    Delta(Epsi) = (n/R) Hpsi + (2/R) x dot grad Hpsi.       (G4)

Both terms are harmonic in B, because Delta(x dot grad Hpsi) = 2 Delta Hpsi + x dot grad Delta Hpsi = 0. Equation (G4) extends continuously to the boundary by the established regularity.

## 3. Complemented clamped range and all harmonic moments

Define bounded operators

    P = I_X - ET : X -> Z,
    Pi = Delta P D : Y -> Y,
    Q = I_Y - Pi = Delta E T D,
    K = P D = D Pi : Y -> Z.                             (G5)

The equality K = D Pi follows from uniqueness of the Dirichlet Laplace problem. Since TE = I, P is a projection onto Z. Consequently Pi is a projection onto Y0 := Delta Z, Q is its complementary projection, and Y0 is closed. For g in Y0, Delta Kg = g; for every h in Z, K Delta h = h. Also K Pi = K.

By (G4), Qf is harmonic. Moreover Q is the identity on harmonic functions in Y. To see this without assuming higher boundary regularity, if f is harmonic then v = Pi f is also harmonic (it is f-Qf), and v = Delta z for z = P Df in Z. Green's formula against any smooth harmonic polynomial H gives integral_B H v = 0. Approximate v uniformly on Bbar by harmonic polynomials: first replace v(x) by v(r x), 0 < r < 1, using its boundary continuity, then use the harmonic Taylor expansion of v(r x) on a slightly larger ball. It follows that integral_B v^2 = 0, so v = 0. Thus Qf = f.

More generally,

    Y0 = {f in Y: integral_B H f = 0 for every harmonic polynomial H}. (G6)

One inclusion follows from the two zero boundary traces of z in Z and Green's formula. For the converse, Pi f has zero such moments, hence so does Qf; Qf is harmonic and the same uniform approximation argument gives Qf = 0. The identity

    integral_B H Qf = integral_B H f                     (G7)

holds for every harmonic polynomial H and, by approximation, every harmonic function continuous on Bbar. Therefore Q agrees on Y with the L^2 orthogonal harmonic Bergman projection. The proof establishes its C^{0,alpha} boundedness in this ball setting; that boundedness was not assumed.

This is an actual construction of a bounded inverse on the closed clamped range. It does not give an inverse on all C^{0,alpha} data, on a positive order ideal, or with the old completed-order norm.

## 4. An explicit convergent graph of nonlinear source data

Fix 2 <= q <= n. Put C1 = binom(n-1,q-1), C2 = binom(n-2,q-2), and

    F(h) = sigma_q(I + D^2h) - binom(n,q)
         = C1 Delta h + N(h),
    N(h) = sum_{k=2}^q binom(n-k,q-k) sigma_k(D^2h).       (G8)

The expansion is the elementary principal-minor identity. N is a continuous polynomial X -> Y with N(0)=DN(0)=0. Choose an equivalent X norm controlling every entry of D^2h in the Hölder algebra norm sup + seminorm. On the X ball of radius r one may use the explicit bound

    ||N(h)-N(k)||_Y <= L(r)||h-k||_X,
    L(r) = sum_{j=2}^q j b_j r^{j-1},
    b_j = binom(n-j,q-j) binom(n,j) j! .                 (G9)

Each determinant has at most j! products, and telescoping a product supplies the factor j. In particular L(r) -> 0 as r -> 0. Also ||N(h)||_Y <= A(||h||_X), A(t)=sum_{j=2}^q b_j t^j.

Let M >= ||K||_{Y -> X}. Choose r > 0 so M L(r)/C1 <= 1/2. For any supplied g in Y0 with ||g||_Y <= C1 r/(2M), define

    h_0 = 0,
    h_{j+1} = (1/C1) K[g - N(h_j)].                     (G10)

Every iterate is in Z. The map in (G10) preserves the closed X ball of radius r and is a contraction of factor at most 1/2 there. The preservation follows from ||T_g(0)|| <= M||g||/C1 <= r/2 and the contraction estimate. Thus the sequence converges in C^{2,alpha} to a uniquely defined small clamped h(g), with

    ||h(g)||_X <= 2M||g||_Y/C1,
    ||h(g)-h_j||_X <= 2^{1-j} M||g||_Y/C1.              (G11)

All inputs of (G10) are the given g, the explicitly constructed linear operator K, and the Hessian polynomial N. No unknown optimizer or nonlinear source solution is used as an assumption.

Define the harmonic correction to the datum by

    b(g) = Q N(h(g)),   f(g) = g + b(g).                 (G12)

Then, because Delta K = Pi and Pi g=g,

    Pi F(h(g)) = g,   Q F(h(g)) = b(g),
    F(h(g)) = f(g).                                     (G13)

The correction is harmonic on the ball and satisfies

    ||b(g)||_Y <= ||Q|| A(2M||g||_Y/C1) = O(||g||_Y^2).  (G14)

It can be approximated by b_j(g)=QN(h_j) with the certified error

    ||b(g)-b_j(g)||_Y <= ||Q|| L(r) 2^{1-j} M||g||_Y/C1. (G15)

For two admissible data, the same contraction argument gives

    ||h(g)-h(g')||_X <= (2M/C1)||g-g'||_Y.                (G16)

Thus (G12) parametrizes a genuine infinite-dimensional set of admissible nonradial data with no finite-angular cutoff. For a prescribed small f, exact membership in this local clamped source range is the data-defined condition

    Qf = b(Pi f),                                       (G17)

provided Pi f is within the parameter budget. Necessity follows by applying Pi to F(h)=f and uniqueness of (G10) among small clamped h. Sufficiency is (G13). Equality in (G17) is not generally decidable from a finite number of approximations; the geometric error budget only certifies approximations and nonzero discrepancies. It must not be advertised as a finite test.

The graph is a classical local analytic graph (analytic implicit-function theorem for the polynomial map h -> Pi F(h), whose derivative C1 Delta:Z ->Y0 is an isomorphism). Analyticity is not needed for the constructive existence result (G10)-(G15). A direct second-order expansion, requiring only the displayed estimates, is

    b(g) = C2 Q sigma_2(D^2[(1/C1)K g]) + O(||g||_Y^3).  (G18)

Indeed h(g)-(1/C1)Kg = O(||g||^2), the quadratic polynomial changes by O(||g||^3), and terms of degree at least three in N are O(||g||^3). Constants are fixed by n,q,alpha,R and the chosen norms.

## 5. Agreement with the preceding obstruction

Use h_* = x_1 chi(|x|), with nonzero smooth annular chi compactly supported in B, and H = x_1^2-x_2^2 from the verified parent second_order_lift_obstruction.md. Put g_* = C1 Delta h_*. This lies in Y0 and K g_* = C1 h_*. The parent identity is

    I_* = integral_B H sigma_2(D^2h_*)
        = 2 area(S^{n-1})/[n(n+2)] integral_0^R r^{n+1}(chi')^2 dr > 0.

Equations (G7) and (G18) imply

    integral_B H b(sg_*) = C2 I_* s^2 + O(|s|^3).         (G19)

So the straight data line s g_* misses the small clamped nonlinear range for every sufficiently small nonzero s. The graph supplies precisely a nonzero harmonic correction at order two. It does not falsely iterate the old compact inverse on an uncorrected nonlinear residual. This is consistent with, and sharper than, the old obstruction to a twice differentiable family of compact corrections. Uniqueness against larger convex competitors can be supplied separately via the integrated Newton tensor; it is not needed for this local graph claim.

## 6. Transfer to the original actual source problem

Use exactly the original field, ordinary torus box, background S=beta^{n-q}[X], and admissible max-reference w from parent_radial_source_proof.md, with w quadratic on B_(2R). Nothing here makes that specified background arbitrary. Choose r further small enough that ||D^2h||_op <= 1/2 and ||h||_infty is less than half the fixed negative margin of w on B_R. The first follows, for example, by n r <= 1/2 in the entrywise norm above.

For the constructed h(g) in Z, its zero extension tilde h is C^{1,1}; its distribution Hessian is the bounded piecewise Hessian, with no hypersurface measure because both the function and its gradient have matching traces. On the protected patch, |x|^2/2 + tilde h has positive distribution Hessian, hence is convex. Therefore u_g=w+tilde h(t) is an actual continuous psh function on the same ordinary representative, with the same ordinary boundary, negative values and bounded finite-mass/no-loss core qualifications as the parent. The root's separate source audit must explicitly use the C^{1,1} seam argument, since the old smooth radial proof had a zero collar.

For completeness, the full source argument is local convolution of the convex C^{1,1} patch. Its smooth convex mollifications converge locally uniformly, have uniformly bounded Hessians, and their Hessians converge almost everywhere to the piecewise Hessian. Each has the frozen full-original-test smooth top-form formula. Dominated convergence of the polynomial densities, and frozen bounded BT continuity on the left, give the same identity for the limit. Thus no interface mass is hidden:

    mu_{u_g} = mu_w + q!(n-q)! sigma_*(1_B f(g) dx).       (G20)

All original compact smooth scalar tests are retained; outside the protected patch, locality leaves mu_w untouched. The constructed datum is positive: inside B it is the strictly positive density of sigma_q(I+D^2h(g)); an independent norm check is ||f(g)||_infty < binom(n,q), obtainable from (G14) by shrinking the input budget; outside B it equals the known positive mu_w. No claim is made about arbitrary original GK delta tests, arbitrary S, completed nonlinear optimizers, or identifications among the three completions.

The substantive difference from merely restating Xi=0 is the verified operator E, projection Pi, clamped inverse K, and convergent data construction (G10)-(G15). Any Xi=0 consequence is only a corollary under the frozen module's exact assumptions. General C2, C1, B1, A1/GQ/KC12/RV4 and the other open interfaces remain open.
