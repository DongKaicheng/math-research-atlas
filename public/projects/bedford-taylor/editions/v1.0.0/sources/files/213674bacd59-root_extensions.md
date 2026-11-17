# Extensions and cross-checks of the clamped nonlinear range construction

Status: candidate proofs written by the root author, submitted for independent review. The main range construction is in `range_graph_audit.md`; the present text supplies a second derivation of its projection estimate, an extension to known strictly convex nonradial references, and conservation checks. These are restricted-sector results and classical-method combinations, not a claim to solve general C2 or to establish worldwide novelty.

## 1. A second proof of the Hölder projection bound

This proof does not use the normal-trace lifting from the main proof. Work first on the unit ball B in R^n, n>=2; V=|B| and omega=nV. Let

    A(x,y)=1-2 x.y+|x|^2|y|^2,
    P(x,y)=(1-|x|^2|y|^2) A(x,y)^(-n/2),
    R(x,y)=(n P(x,y)+2 x.grad_x P(x,y))/omega.

The last kernel is the harmonic Bergman kernel relative to ordinary Lebesgue measure. Its normalization follows directly by expanding the extended Poisson kernel in spherical harmonics: for a homogeneous harmonic polynomial of degree l the radial integral contributes 1/(n+2l), which cancels the factor n+2l from the numerator. Thus the integral operator Q reproduces harmonic polynomials and is their L2 orthogonal projection; the symmetry of the kernel follows since P depends on x.y and |x|^2|y|^2 and the two Euler derivatives agree. In particular integral_B R(x,y)dy=1. A primary reference for this classical kernel is Karel Stroethoff, *Harmonic Bergman Spaces*, MSRI Publications 33 (1998), section 2, formulas (2-3)--(2-6), and section 4, formula (4-7). Its ordinary Lp theorem is not being cited as a Hölder theorem.

Direct differentiation gives, with a=|x|^2|y|^2,

    R(x,y)=[n(1-a)^2-4aA]/[omega A^(1+n/2)].

Since 1-a<=2 sqrt(A), |grad_x A|<=2 sqrt(A), and the variables stay in the unit ball, this implies

    |R(x,y)|<=C A^(-n/2),
    |grad_x R(x,y)|<=C A^(-(n+1)/2).                    (E1)

The derivative bound can also be obtained by differentiating the displayed numerator: the derivative of (1-a)^2 is O(sqrt A), the derivative of aA is O(sqrt A), and the numerator is O(A). Multiplying the latter by the derivative of A^(-1-n/2) gives the same bound.

For f in C^{0,alpha}(Bbar), take x=r theta, r>=1/2, delta=1-r. Since A=|theta-r y|^2 and theta.(theta-y)>=0,

    A >= delta^2+r^2|theta-y|^2
      >= c(delta+|theta-y|)^2.

Differentiate Qf under the integral for interior x and subtract the constant f(theta), using integral grad_x R=0. Equation (E1) gives

    |grad Qf(x)| <= C [f]_alpha
       integral_B |theta-y|^alpha/(delta+|theta-y|)^(n+1)dy
      <= C [f]_alpha delta^(alpha-1).                   (E2)

Indeed polar integration about theta bounds the integral by a constant times integral_0^2 t^(n-1+alpha)/(delta+t)^(n+1)dt; substitute t=delta s and use alpha<1. On the inner half-ball the kernel derivative is bounded. Also Qf(0)=V^(-1) integral_B f.

For clarity, the weighted gradient bound in (E2) implies an actual C^alpha bound, not merely a growth condition. For two interior points x,y at distance d<1/2, put x'=(1-d)x and y'=(1-d)y. Each radial segment from x to x', or from y to y', has function variation at most C d^alpha by integrating (1-r)^(alpha-1). The segment [x',y'] lies at depth at least d, has length at most d, and contributes at most C d^alpha. Distances >=1/2 are handled by the uniform bound obtained by radial integration from the origin. Therefore

    ||Qf||_{C^alpha(Bbar)} <= C(n,alpha)||f||_{C^alpha(Bbar)}. (E3)

Rescale for B_R. Since Qf has the same harmonic moments as f, Green's formula gives that D(I-Q)f has both zero boundary traces. This recovers the main clamped inverse K=D(I-Q) without using a fictitious compact-support inverse on all data. It is also a separate check that no angular-frequency cutoff is hidden in the construction.

## 2. Known nonradial strictly convex references

Let v be a specified C^{2,alpha} real function on the protected ball B_(2R), with D^2v>=c I, c>0, on a neighborhood of Bbar=Bbar_R. It is known input, not an unknown solution. Suppose an already constructed bounded actual reference W agrees with v(t) plus a known constant on that protected neighborhood. Keep S=beta^(n-q)[X], with 2<=q<=n. Outside the changed closed ball W is left unchanged and retains its assumed actual psh/core properties.

Define

    F_v(h)=sigma_q(D^2v+D^2h)-sigma_q(D^2v),
    L_v h=T_{q-1}(D^2v):D^2h,
    N_v(h)=F_v(h)-L_v h.

The Newton tensor has C^alpha coefficients and is uniformly positive: its eigenvalues are sums of (q-1)-fold products of the eigenvalues of D^2v, so each is at least binom(n-1,q-1)c^(q-1). It is bounded above by a constant determined by ||v||_{C^{2,alpha}}. The classical ball Dirichlet Schauder isomorphism therefore supplies an actual bounded inverse D_v:Y->X for L_v. Unlike LI13, this is an inverse in ordinary Hölder spaces with zero Dirichlet values only.

Use the explicit universal boundary lifting E and trace T from the main proof, put P=I-ET, and define

    K_v=P D_v,
    Pi_v=L_v K_v,
    Q_v=I-Pi_v=L_v E T D_v.                              (E4)

Because D_v L_v is identity on X, Pi_v is a bounded projection onto Y_v=L_v Z, and K_v=D_v Pi_v. In particular K_v L_v h=h for h in Z. All these operators are constructed from the known v and the classical Dirichlet inverse. The complement image Q_v Y need not consist of harmonic functions for the ordinary Laplacian; no such identification is claimed.

For sufficiently small prescribed g in Y_v, iterate

    h_0=0,
    h_{j+1}=K_v[g-N_v(h_j)].                             (E5)

The polynomial N_v has zero value and first derivative at zero, and satisfies ||N_v(h)-N_v(k)||_Y<=L_v^*(r)||h-k||_X on the r-ball, with L_v^*(r)->0. This follows by expanding the principal minors with their known C^alpha coefficient functions; ordinary Hölder multiplication gives the estimate. Choose r with ||K_v||L_v^*(r)<=1/2 and ||g||_Y<=r/(2||K_v||). Also shrink r so ||D^2h||op<=c/2 and the negative margin of W on the protected ball is preserved. Then (E5) converges with the same geometric tail estimate as the main proof. It yields

    F_v(h(g))=g+Q_v N_v(h(g)).                            (E6)

The correction is quadratic in ||g||_Y; exact local membership is Q_v f=Q_v N_v(h(Pi_v f)). This equality is a convergently evaluable data condition, not in general a finite decision test. For generation rather than testing, g is free in the explicitly defined closed linear range and (E5)-(E6) generate its compatible datum.

There is an equivalent moment description of that linear range when desired. The Newton tensor is divergence-free distributionally, first for smooth v by antisymmetry of the Hessian minors, and then for C^{2,alpha} v by local smooth approximation. If phi solves L_v phi=0 with smooth boundary values, Green's formula for z=D_v g gives

    integral_B phi g = integral_boundary phi (nu.T_{q-1}(D^2v).nu) partial_nu z.

Here z has zero Dirichlet trace, so its gradient on the boundary is purely normal. The coefficient nu.T.nu is continuous and strictly positive. Since arbitrary smooth boundary functions occur as traces of these known linear harmonic extensions, g lies in Y_v precisely when all these moments vanish. This identity can be justified for C^{2,alpha} v and z using C^2 approximation in the integration-by-parts formula; no third classical derivatives are required. Alternatively the directly defined projection Pi_v already provides the criterion and needs no Green formula.

Zero extension of h(g) is C^{1,1}, its gradient matches at the sphere, and the protected profile v+tilde h is convex distributionally. The main local convolution proof, with bounded Hessian density rather than any singular interface, gives

    mu_(W+tilde h)=mu_W+q!(n-q)! sigma_*(1_B F_v(h) dx).  (E7)

The exterior remains exactly W. Positivity of the displayed datum follows either from the controlled positive Hessian or from a strict lower bound on the known reference density and the explicit smallness bound on F_v(h). Ordinary boundary and bounded actual-core qualifications are inherited as in the parent proof. This extends the construction past radial reference profiles, but retains a specified smooth toric background and strict ellipticity. It is not a theorem for arbitrary middle-positive current S.

## 3. Conservation and checks on the nonlinear harmonic correction

Return to the quadratic reference and Q in the main theorem. If h in Z, its zero extension is compactly supported and C^{1,1}. For each 1<=k<=n and every affine function a,

    integral_B a sigma_k(D^2h) dx=0.                    (E8)

Proof: mollify the compact zero extension, retaining compact support in a slightly larger ball. For smooth compact functions the Newton identities give k sigma_k=div(T_{k-1} grad h) and div T_{k-1}=0. Integrating against affine a once gives -(1/k) integral grad a.T_{k-1}grad h. Integrating again gives zero because grad a is constant and the tensor is divergence-free. For k=1 the tensor is the identity, so the same formula applies. Mollified Hessians are uniformly bounded and converge almost everywhere; dominated convergence proves (E8). This argument uses no positivity of h itself.

Consequently the exact graph correction b(g)=QN(h(g)) has zero integral and zero first moments. Since b is harmonic on the ball centered at zero, the mean-value identity and the degree-one harmonic coefficients imply

    b(g)(0)=0,     grad b(g)(0)=0.                      (E9)

The correction begins in harmonic degrees >=2. A nonzero b(g) cannot have one sign. Thus one must not describe this construction as adding a positive measure to fix compatibility; it alters the density in both directions, with positivity secured by the strictly positive reference density and the explicit small budget.

If g is radial and lies in Y0, the uniquely constructed h(g) is radial because all operators and the iteration commute with rotations. Then b(g) is radial harmonic and hence constant; (E8) forces b(g)=0. This recovers the prior radial weighted-mass construction within the common small Hölder regime. The parent radial result itself has a distinct, explicit C0 smallness budget and is not replaced by this narrower Hölder argument.

Nonradial data do not automatically require a nonzero correction. Take a finite collection of disjoint protected balls and on each prescribe a translated radial smooth density with zero weighted integral, sufficiently small for the parent radial construction. The associated explicit corrections have disjoint supports. Their sum is nonradial in general, and every Hessian polynomial is pointwise the sum of the separate perturbations; hence its exact source is the prescribed sum. Each summand has zero harmonic moments by the spherical mean-value property and zero mass. The total datum lies in Y0 and, within the graph's small budget, has b(g)=0 by uniqueness. This direct corollary prevents a false rigidity inference from the one explicit nonradial obstruction.

For q=2, integration by parts also gives, for any H smooth and harmonic on a neighborhood of Bbar,

    integral_B H b(g) = (1/2) integral_B D^2H(grad h(g),grad h(g)). (E10)

Here the coefficient binom(n-2,q-2) is 1. The identity follows from sigma_2=((Delta h)^2-|D^2h|^2)/2 and two integrations by parts, using clamped boundary traces; alternatively apply the compact mollification argument. It matches the positive degree-two moment for h=x_1 chi(r) in the prior obstruction. For q>2 there are additional higher-minor terms, so (E10) must not be reused without them.

## 4. Limits of the method

The fixed-reference construction uses an actual classical Schauder inverse and a verified boundary projection. Its constants depend on a strict ellipticity lower bound and on C^alpha coefficient bounds. No uniformity as the current background becomes singular or the reference Hessian degenerates is established. R17 LI20-LI21 already show why broad all-test admissibility and bounded energies do not imply the different, stronger order-ideal inverse LI13; that frozen obstruction is retained, not rediscovered here. The new Hölder graph is not an order-ideal saturation theorem and does not compare the Q-order, strong E1, and Borel-capacity completions.

The general C2 task still requires independently checkable conditions covering arbitrary permitted S and genuine original data, with source equality on the full original test class. No conclusion about arbitrary non-toric potentials or general completed solutions follows from the compact convex-profile obstruction.
